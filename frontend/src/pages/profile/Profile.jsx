import React, { useState } from "react";
import {
  User,
  Mail,
  Pencil,
  Lock,
  LogOut,
  X,
  Save,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

const Profile = () => {
  const {
    user,
    updateProfile,
    changePassword,
    logout,
  } = useAuth();

  const navigate = useNavigate();

  const storedUser = JSON.parse(
    localStorage.getItem("user") ||
      localStorage.getItem("userData") ||
      "{}"
  );

  const initialName =
    user?.name ||
    storedUser?.name ||
    storedUser?.full_name ||
    storedUser?.username ||
    "User";

  const initialEmail =
    user?.email ||
    storedUser?.email ||
    "";

  const [name, setName] = useState(initialName);
  const [email] = useState(initialEmail);

  const [editMode, setEditMode] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);

  const [editName, setEditName] = useState(initialName);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // ======================================================
  // EDIT PROFILE
  // ======================================================

  const handleEditProfile = () => {
    setError("");
    setMessage("");
    setEditName(name);
    setEditMode(true);
    setPasswordMode(false);
  };

  const handleCancelEdit = () => {
    setEditName(name);
    setEditMode(false);
    setError("");
    setMessage("");
  };

  const handleSaveProfile = async () => {
    const trimmedName = editName.trim();

    if (!trimmedName) {
      setError("Name cannot be empty.");
      return;
    }

    if (trimmedName === name) {
      setEditMode(false);
      setError("");
      setMessage("");
      return;
    }

    try {
      setSavingProfile(true);
      setError("");
      setMessage("");

      const result = await updateProfile(trimmedName);

      if (!result?.success) {
        setError(
          result?.error ||
            "Failed to update profile."
        );
        return;
      }

      // Update local page immediately
      setName(result.user?.name || trimmedName);
      setEditName(result.user?.name || trimmedName);

      setEditMode(false);

      setMessage(
        "Profile updated successfully."
      );

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (err) {
      console.error(
        "Profile update error:",
        err
      );

      setError(
        "Failed to update profile."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // ======================================================
  // CHANGE PASSWORD
  // ======================================================

  const handleChangePassword = () => {
    setError("");
    setMessage("");

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    setPasswordMode(true);
    setEditMode(false);
  };

  const handleCancelPassword = () => {
    setPasswordMode(false);

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    setError("");
    setMessage("");
  };

  const handleUpdatePassword = async () => {
    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setError(
        "Please fill in all password fields."
      );
      return;
    }

    if (newPassword.length < 6) {
      setError(
        "New password must contain at least 6 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(
        "New password and confirmation password do not match."
      );
      return;
    }

    try {
      setChangingPassword(true);
      setError("");
      setMessage("");

      const result = await changePassword(
        currentPassword,
        newPassword
      );

      if (!result?.success) {
        setError(
          result?.error ||
            "Failed to change password."
        );
        return;
      }

      setPasswordMode(false);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setMessage(
        "Password changed successfully."
      );

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (err) {
      console.error(
        "Change password error:",
        err
      );

      setError(
        "Failed to change password."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  // ======================================================
  // LOGOUT
  // ======================================================

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // ======================================================
  // AVATAR INITIAL
  // ======================================================

  const getInitial = () => {
    return (
      name?.charAt(0)?.toUpperCase() ||
      "U"
    );
  };

  return (
    <div className="profile-page">

      {/* ================================
          PAGE HEADER
      ================================= */}

      <div className="profile-page-header">
        <div>
          <div className="profile-title-row">
            <div className="profile-title-icon">
              <User size={24} />
            </div>

            <div>
              <h1>My Profile</h1>

              <p>
                Manage your personal information and account security.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ================================
          SUCCESS / ERROR MESSAGE
      ================================= */}

      {message && (
        <div className="profile-message success-message">
          <ShieldCheck size={18} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="profile-message error-message">
          <X size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* ================================
          MAIN PROFILE CARD
      ================================= */}

      <div className="profile-main-card">

        {/* ================================
            PROFILE HERO
        ================================= */}

        <div className="profile-hero">

          <div className="profile-avatar">
            {getInitial()}
          </div>

          <div className="profile-hero-info">
            <h2>{name}</h2>

            <div className="profile-email">
              <Mail size={15} />
              <span>
                {email || "Email not available"}
              </span>
            </div>

            <div className="profile-member-badge">
              <ShieldCheck size={14} />
              <span>Account Profile</span>
            </div>
          </div>

        </div>

        {/* ================================
            PERSONAL INFORMATION
        ================================= */}

        <div className="profile-section">

          <div className="profile-section-header">

            <div>
              <h3>Personal Information</h3>

              <p>
                Your registered account information.
              </p>
            </div>

            {!editMode && !passwordMode && (
              <button
                className="profile-outline-button"
                onClick={handleEditProfile}
                disabled={savingProfile}
              >
                <Pencil size={16} />
                Edit Profile
              </button>
            )}

          </div>

          {!editMode ? (

            <div className="profile-info-grid">

              <div className="profile-info-card">

                <div className="profile-info-icon">
                  <User size={19} />
                </div>

                <div>
                  <span className="profile-label">
                    Full Name
                  </span>

                  <strong>
                    {name}
                  </strong>
                </div>

              </div>

              <div className="profile-info-card">

                <div className="profile-info-icon">
                  <Mail size={19} />
                </div>

                <div>
                  <span className="profile-label">
                    Email Address
                  </span>

                  <strong>
                    {email || "Email not available"}
                  </strong>
                </div>

              </div>

            </div>

          ) : (

            <div className="profile-edit-form">

              <div className="profile-form-group">

                <label htmlFor="profile-name">
                  Full Name
                </label>

                <div className="profile-input-wrapper">

                  <User size={18} />

                  <input
                    id="profile-name"
                    type="text"
                    value={editName}
                    onChange={(e) =>
                      setEditName(e.target.value)
                    }
                    placeholder="Enter your name"
                    disabled={savingProfile}
                  />

                </div>

              </div>

              <div className="profile-form-group">

                <label>
                  Email Address
                </label>

                <div className="profile-input-wrapper disabled-input">

                  <Mail size={18} />

                  <input
                    type="email"
                    value={email}
                    disabled
                  />

                </div>

                <small>
                  Email address cannot be changed here.
                </small>

              </div>

              <div className="profile-form-actions">

                <button
                  className="profile-cancel-button"
                  onClick={handleCancelEdit}
                  disabled={savingProfile}
                >
                  <X size={16} />
                  Cancel
                </button>

                <button
                  className="profile-primary-button"
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                >
                  <Save size={16} />

                  {savingProfile
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </div>

          )}

        </div>

        {/* ================================
            SECURITY
        ================================= */}

        <div className="profile-section">

          <div className="profile-section-header">

            <div>
              <h3>Security</h3>

              <p>
                Keep your account secure and protected.
              </p>
            </div>

          </div>

          {!passwordMode ? (

            <div className="security-card">

              <div className="security-icon">
                <Lock size={22} />
              </div>

              <div className="security-content">

                <h4>Password</h4>

                <p>
                  Change your account password regularly
                  to keep your account secure.
                </p>

              </div>

              <button
                className="profile-outline-button"
                onClick={handleChangePassword}
                disabled={changingPassword}
              >
                <Lock size={16} />
                Change Password
              </button>

            </div>

          ) : (

            <div className="password-form">

              <div className="profile-form-group">

                <label htmlFor="current-password">
                  Current Password
                </label>

                <div className="profile-input-wrapper">

                  <Lock size={18} />

                  <input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) =>
                      setCurrentPassword(e.target.value)
                    }
                    placeholder="Enter current password"
                    disabled={changingPassword}
                  />

                </div>

              </div>

              <div className="profile-form-group">

                <label htmlFor="new-password">
                  New Password
                </label>

                <div className="profile-input-wrapper">

                  <Lock size={18} />

                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) =>
                      setNewPassword(e.target.value)
                    }
                    placeholder="Enter new password"
                    disabled={changingPassword}
                  />

                </div>

              </div>

              <div className="profile-form-group">

                <label htmlFor="confirm-password">
                  Confirm New Password
                </label>

                <div className="profile-input-wrapper">

                  <Lock size={18} />

                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    placeholder="Confirm new password"
                    disabled={changingPassword}
                  />

                </div>

              </div>

              <div className="profile-form-actions">

                <button
                  className="profile-cancel-button"
                  onClick={handleCancelPassword}
                  disabled={changingPassword}
                >
                  <X size={16} />
                  Cancel
                </button>

                <button
                  className="profile-primary-button"
                  onClick={handleUpdatePassword}
                  disabled={changingPassword}
                >
                  <ShieldCheck size={16} />

                  {changingPassword
                    ? "Updating..."
                    : "Update Password"}
                </button>

              </div>

            </div>

          )}

        </div>

        {/* ================================
            LOGOUT
        ================================= */}

        <div className="profile-logout-section">

          <div className="logout-info">

            <div className="logout-icon">
              <LogOut size={20} />
            </div>

            <div>
              <h3>Sign out</h3>

              <p>
                End your current MockMind AI session.
              </p>
            </div>

          </div>

          <button
            className="profile-logout-button"
            onClick={handleLogout}
          >
            <LogOut size={17} />
            Logout
          </button>

        </div>

      </div>
    </div>
  );
};

export default Profile;