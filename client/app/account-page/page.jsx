"use client";
import Link from "next/link";
import React, { useState } from 'react'
import { CameraIcon, UserIcon, SaveIcon } from "lucide-react";
import s from "./Account.module.css";

export default function Account() {
    // store and set current profile image
    const [profileImage, setProfileImage] = useState('https://static.clubs.nfl.com/image/upload/t_editorial_landscape_12_desktop/bills/f8kygnccjsnptgeqpqi9')

    const [email, setEmail] = useState('joshallen@gmail.com')
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [username, setUsername] = useState('Josh Allen')

    // handle a new profile image being uploaded when camera button is clicked
    const handleImageUpload = (e) => {
        // extract image file from event object
        const image = e.target.files[0]
        if (image) {
            // create a fileReader object, which parses the image file and turns it into a URL that the profile pic can be set to
            const reader = new FileReader()
            reader.onloadend = () => {
                setProfileImage(reader.result)
            }
            reader.readAsDataURL(image)
        }
    }

    const handleSave = (e) => {
        e.preventDefault()
        alert('Profile updated successfully!')
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
