"use client";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";

export default function UserExample() {
  const { user, authenticated, loading, logout } = useUser();
  const router = useRouter();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!authenticated) {
    return (
      <div>
        <p>Not logged in</p>
        <button onClick={() => router.push("/login")}>Login</button>
      </div>
    );
  }

  return (
    <div>
      <p>Welcome, {user.displayName}!</p>
      <p>Email: {user.email}</p>
      <button
        onClick={async () => {
          await logout();
          router.push("/login");
        }}
      >
        Logout
      </button>
    </div>
  );
}

