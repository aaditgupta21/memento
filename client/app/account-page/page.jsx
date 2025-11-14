"use client";
import Link from "next/link";
import React, { useState } from 'react'
import { CameraIcon, UserIcon, SaveIcon } from "lucide-react";
import s from "./Account.module.css";

export default function Account() {
    const [profileImage, setProfileImage] = useState('https://static.clubs.nfl.com/image/upload/t_editorial_landscape_12_desktop/bills/f8kygnccjsnptgeqpqi9');
    const [email, setEmail] = useState('joshallen@gmail.com');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [username, setUsername] = useState('joshallengoat');

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    // handle a new profile image being uploaded when camera button is clicked
    const handleImageUpload = (e) => {
        // extract image file from event object
        const image = e.target.files[0];
        if (image) {
            // create a fileReader object, which parses the image file and turns it into a URL that the profile pic can be set to
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result);
            }
            reader.readAsDataURL(image);
        }
    }


    // UNCOMMENT WHEN API IS MADE
    // useEffect(() => {
    //     const getUser = async () => {
    //       const response = await fetch("http://localhost:4000/auth/me", {
    //         credentials: "include"
    //       });

    //       const data = await response.json();
    //       setEmail(data.email);
    //       setUsername(data.username);
    //       setProfileImage(data.profileImage);
    //     };

    //     getUser();
    //   }, []);


    // for now handle submission by reloading component only and delivering success message
    const handleSave = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            // check for correct email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new Error("Please enter valid email address");
            }


            // check that username is at least 1 character long, all lowercase letters
            const usernameRegex = /^[a-z0-9_.]+$/;

            if (username.trim().length < 1) {
                throw new Error("Username must be at least 1 character long.");
            }

            if (!usernameRegex.test(username)) {
                throw new Error("Username can only contain lowercase letters, numbers, underscores, and periods");
            }

            

            // check that passwords entered were valid
            if (currentPassword || newPassword || confirmPassword) {

                if (!currentPassword) {
                    throw new Error("Please enter your current password.");
                }

                const strongPassword = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
                if (!strongPassword.test(newPassword)) {
                    throw new Error("Password must be 8+ characters and include a letter, number, and special character (!@#$%^&*)");
                }

                if (newPassword !== confirmPassword) {
                    throw new Error("New passwords do not match.");
                }

            }

            // send the profile updates to the backend
            const profileUpdate = await fetch("http://localhost:4000/account/updateProfile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    email, username, profileImage
                })
            });

            // check if the updates were successful
            const profileUpdateData = await profileUpdate.json()
            if (!profileUpdate.ok) {
                throw new Error(profileUpdateData.error || "Failed to update profile.")
            }


            if (newPassword) {
                // send the requested password change to the backend
                const pwUpdate = await fetch("http://localhost:4000/account/updatePassword", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        currentPassword, newPassword
                    })
                });

                // check if the password change was successful
                const pwUpdateData = await pwUpdate.json();
                if (!pwUpdate.ok) {
                    throw new Error(pwUpdateData.error || "Failed to update password.");
                }
            }

            setSuccess("Account updated successfully!");
        } catch (err) {
            console.error(err);
            setError(err.message || "Something went wrong. Please try again.");
        }
        finally {
            setLoading(false);
        }

    }

    return (
        <div className={s.container}>
            <div className={s.content}>
                <h1 className={s.title}>Account Settings</h1>
                <div className={s.card}>
                    <div className={s.profileSection}>
                        <div className={s.profileImageWrapper}>
                            <div className={s.profileImage}>
                                {profileImage ? (
                                    <img src={profileImage} alt="Profile" />
                                ) : (
                                    <div className={s.profileImagePlaceholder}>
                                        <UserIcon size={48} />
                                    </div>
                                )
                                }
                            </div>
                            <label className={s.cameraButton}>
                                <CameraIcon size={20} />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />
                            </label>
                        </div>
                        <p className={s.profileHint}>Click the camera icon to update your profile picture</p>
                    </div>

                    <form onSubmit={handleSave} className={s.form}>
                        <div className={s.formGroup}>
                            <h3 className={s.sectionTitle}>Change Email</h3>
                            <label className={s.label}>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={s.input}
                                placeholder="youremail@gmail.com"
                            />
                        </div>
                        <div className={s.passwordSection}>
                            <h3 className={s.sectionTitle}>Change Username</h3>
                            <div className={s.formGroup}></div>
                            <label className={s.label}>Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className={s.input}
                                placeholder="Your username"
                            />
                        </div>
                        <div className={s.passwordSection}>
                            <h3 className={s.sectionTitle}>Change Password</h3>
                            <p className={s.passwordHint}>
                                Must be 8+ characters and include a letter, number, and special character (!@#$%^&*)
                            </p>
                            <div className={s.passwordFields}>
                                <div className={s.formGroup}>
                                    <label className={s.label}>Current Password</label>
                                    <input
                                        type="password"
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className={s.input}
                                        placeholder="Enter current password"
                                    />
                                </div>
                                <div className={s.formGroup}>
                                    <label className={s.label}>New Password</label>
                                    <input
                                        type="password"
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className={s.input}
                                        placeholder="Enter new password"
                                    />
                                </div>
                                <div className={s.formGroup}>
                                    <label className={s.label}>Confirm New Password</label>
                                    <input
                                        type="password"
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className={s.input}
                                        placeholder="Confirm new password"
                                    />
                                </div>
                            </div>
                        </div>
                        <button type="submit" className={s.saveButton}>
                            <SaveIcon size={20} />
                            Save Changes
                        </button>
                    </form>
                </div>
            </div >
        </div >
    )
}
