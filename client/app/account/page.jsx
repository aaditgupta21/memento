/* client/app/account/page.jsx
 * GenAI Usage Note: When adding profile picture upload functionality, I used Copilot to
 * understand how to integrate UploadThing's UploadButton component. Example prompts: "How do
 * I use UploadThing's UploadButton component in a Next.js app?" and "How do I handle the
 * onClientUploadComplete callback to save the uploaded image URL to my backend?" I reviewed
 * the UploadThing documentation and implemented the handleProfilePictureUpload function to
 * immediately save the profile picture URL to the backend after upload completes, ensuring
 * the UI updates in real-time.
 */

"use client";
import Link from "next/link";
import Image from "next/image";
import React, { useState, useEffect } from 'react'
import { useRouter } from "next/navigation";
import { CameraIcon, UserIcon, SaveIcon } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { UploadButton } from "@/utils/uploadthing";
import s from "./Account.module.css";

export default function Account() {
    const { user, loading: userLoading, fetchUser } = useUser();
    const router = useRouter();

    // Redirect to home page if not logged in
    useEffect(() => {
        if (!userLoading && !user) {
            router.push("/");
        }
    }, [userLoading, user, router]);
    const [profileImage, setProfileImage] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [isGoogleUser, setIsGoogleUser] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    // Handles a profile picture upload and immediately saves it to the backend
    const handleProfilePictureUpload = async (uploadedFiles) => {
        // Guard clause prevents null photos from being processed early 
        if (!uploadedFiles?.length) return;

        const imageUrl = uploadedFiles[0].url;
        // Update profile image on the frontend to minimize loading if it succeeds
        setProfileImage(imageUrl);

        // Attempt to send the new profile pic to the server
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL;

            const response = await fetch(`${API_URL}/api/users/update-profile-picture`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ profilePicture: imageUrl }),
            });

            const data = await response.json();
            
            if (response.ok) {
                // Update page with new profile pic and show a temporary success message to tell the user it worked
                setSuccess("Profile picture updated successfully!");
                await fetchUser();
                setTimeout(() => setSuccess(""), 3000);
            } else {
                setError(data.error || "Failed to update profile picture");
            }
        } catch (err) {
            console.error("Error updating profile picture:", err);
            setError("Failed to update profile picture");
        }
    };



    // Initialize form fields from UserContext
    useEffect(() => {
        if (user) {
            setEmail(user.email || '');
            setUsername(user.displayName || '');
            // Populate firstName and lastName from database
            setFirstName(user.firstName || '');
            setLastName(user.lastName || '');
            setProfileImage(user.profilePicture || '');
            setIsGoogleUser(!!user.googleId);
        }
    }, [user]);


    // for now handle submission by reloading component only and delivering success message
    const handleSave = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            // check that username is at least 1 character long, all lowercase letters
            const usernameRegex = /^[a-z0-9_.]+$/;

            if (username.trim().length < 1) {
                throw new Error("Username must be at least 1 character long.");
            }

            if (!usernameRegex.test(username)) {
                throw new Error("Username can only contain lowercase letters, numbers, underscores, and periods");
            }



            // check that passwords entered were valid (only for non-Google users)
            if (!isGoogleUser && (currentPassword || newPassword || confirmPassword)) {

                if (!currentPassword) {
                    throw new Error("Please enter your current password.");
                }

                // Strong password validation disabled for now
                // const strongPassword = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
                // if (!strongPassword.test(newPassword)) {
                //     throw new Error("Password must be 8+ characters and include a letter, number, and special character (!@#$%^&*)");
                // }

                if (newPassword !== confirmPassword) {
                    throw new Error("New passwords do not match.");
                }

            }

            let usernameChanged = false;
            let passwordChanged = false;
            let nameChanged = false;

            // Update username if it changed
            if (username !== user.displayName) {
                const API_URL = process.env.NEXT_PUBLIC_API_URL;
                const usernameUpdate = await fetch(`${API_URL}/api/users/update-username`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        displayName: username
                    })
                });

                const usernameUpdateData = await usernameUpdate.json();
                if (!usernameUpdate.ok) {
                    throw new Error(usernameUpdateData.error || "Failed to update username.");
                }

                usernameChanged = true;
                // Refresh user data in context after username change
                await fetchUser();
            }

            // Update firstName and lastName if changed (only for non-Google users)
            if (!isGoogleUser && (firstName !== (user.firstName || '') || lastName !== (user.lastName || ''))) {
                const API_URL = process.env.NEXT_PUBLIC_API_URL;
                const nameUpdate = await fetch(`${API_URL}/api/users/update-name`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        firstName: firstName.trim(),
                        lastName: lastName.trim()
                    })
                });

                const nameUpdateData = await nameUpdate.json();
                if (!nameUpdate.ok) {
                    throw new Error(nameUpdateData.error || "Failed to update name.");
                }

                nameChanged = true;
                await fetchUser();
            }


            if (!isGoogleUser && newPassword) {
                // send the requested password change to the backend
                const API_URL = process.env.NEXT_PUBLIC_API_URL;
                const pwUpdate = await fetch(`${API_URL}/api/update-password`, {
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
                passwordChanged = true;

                // Clear password fields after successful update
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            }

            // Provide specific feedback based on what was updated
            const updates = [];
            if (usernameChanged) updates.push(`Username changed to "${username}"`);
            if (nameChanged) updates.push("Name updated");
            if (passwordChanged) updates.push("password updated");

            if (updates.length > 0) {
                setSuccess(`${updates.join(", ")} successfully!`);
            } else {
                setSuccess("No changes to save.");
            }

            // Clear success message after 5 seconds
            if (usernameChanged || nameChanged || passwordChanged) {
                setTimeout(() => {
                    setSuccess("");
                }, 5000);
            }
        } catch (err) {
            console.error(err);
            setError(err.message || "Something went wrong. Please try again.");
        }
        finally {
            setLoading(false);
        }

    }

    if (userLoading) {
        return (
            <div className={s.container}>
                <div className={s.content}>
                    <h1 className={s.title}>Account Settings</h1>
                    <div className={s.card}>
                        <p>Loading...</p>
                    </div>
                </div>
            </div>
        );
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
                                    <Image
                                        src={profileImage}
                                        alt="Profile"
                                        width={128}
                                        height={128}
                                        className={s.profileImageImg}
                                    />
                                ) : (
                                    <div className={s.profileImagePlaceholder}>
                                        <UserIcon size={48} />
                                    </div>
                                )
                                }
                            </div>
                            <div className={s.cameraButton}>
                                <UploadButton
                                    endpoint="profilePictureUploader"
                                    onClientUploadComplete={(res) => {
                                        if (res && res.length > 0) {
                                            handleProfilePictureUpload(res);
                                        }
                                    }}
                                    onUploadError={(error) => {
                                        setError(`Upload failed: ${error.message}`);
                                    }}
                                    appearance={{
                                        allowedContent: {
                                            display: "none",
                                        },
                                        button: {
                                            width: "100%",
                                            height: "100%",
                                            padding: 0,
                                            background: "transparent",
                                            border: "none",
                                        },
                                    }}
                                    content={{
                                        button: ({ ready }) => (
                                            <CameraIcon size={16} />
                                        ),
                                    }}
                                />
                            </div>
                        </div>
                        <p className={s.profileHint}>Click the camera icon to update your profile picture</p>
                    </div>

                    {error && (
                        <div className={s.errorMessage}>
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className={s.successMessage}>
                            {success}
                        </div>
                    )}
                    <form onSubmit={handleSave} className={s.form}>
                        <div className={s.formGroup}>
                            <h3 className={s.sectionTitle}>Email Address</h3>
                            <label className={s.label}>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                disabled
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
                        {!isGoogleUser && (
                            <div className={s.passwordSection}>
                                <h3 className={s.sectionTitle}>Name</h3>
                                <div className={s.passwordFields}>
                                    <div className={s.formGroup}>
                                        <label className={s.label}>First Name</label>
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className={s.input}
                                            placeholder="Enter your first name"
                                        />
                                    </div>
                                    <div className={s.formGroup}>
                                        <label className={s.label}>Last Name</label>
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className={s.input}
                                            placeholder="Enter your last name"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                        {isGoogleUser ? (
                            <div className={s.passwordSection}>
                                <h3 className={s.sectionTitle}>Account Type</h3>
                                <p className={s.passwordHint}>
                                    You are signed in with a Google account. Name and password changes are not available for Google accounts.
                                </p>
                            </div>
                        ) : (
                            <div className={s.passwordSection}>
                                <h3 className={s.sectionTitle}>Change Password</h3>
                                <p className={s.passwordHint}>
                                    Enter your current password and choose a new password.
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
                        )}
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
