"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-fetch";
import type { NotificationRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

const POLL_INTERVAL = 30_000;

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiFetch("/api/notifications");
      if (!res.ok) return;
      const data: { notifications: NotificationRecord[]; unread: number } =
        await res.json();
      setNotifications(data.notifications);
      setUnread(data.unread);
    } catch {
      // silently ignore fetch errors
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function markAsRead(ids: number[]) {
    try {
      await apiFetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ids.length > 0 ? { ids } : {}),
      });
    } catch {
      // silently ignore
    }
  }

  async function handleMarkAllRead() {
    await markAsRead([]);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  }

  async function handleNotificationClick(notification: NotificationRecord) {
    if (!notification.read) {
      await markAsRead([notification.id]);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
      );
      setUnread((prev) => Math.max(0, prev - 1));
    }
    setOpen(false);
    if (notification.link) {
      router.push(notification.link);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "relative rounded-lg p-2 transition-colors",
          "text-[#0E2931]/70 hover:bg-[#0E2931]/5 hover:text-[#0E2931]",
        )}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
      >
        {/* Bell SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>

        {/* Unread badge */}
        {unread > 0 && (
          <span
            className={cn(
              "absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center",
              "rounded-full bg-[#861211] px-1 text-[10px] font-semibold leading-none text-white",
            )}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={cn(
            "absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-xl",
            "border border-[#0E2931]/10 bg-[#F6F6F4] shadow-lg",
            "z-50",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#0E2931]/10 px-4 py-3">
            <h3 className="text-sm font-semibold text-[#0E2931]">
              Notifications
            </h3>
            {unread > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-[#2B7574] transition-colors hover:text-[#12484C]"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[#0E2931]/50">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "flex w-full flex-col gap-0.5 border-b border-[#0E2931]/5 px-4 py-3 text-left transition-colors",
                    "hover:bg-[#0E2931]/[0.03]",
                    !notification.read && "bg-[#2B7574]/[0.06]",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={cn(
                        "text-sm leading-snug",
                        notification.read
                          ? "text-[#0E2931]/70"
                          : "font-medium text-[#0E2931]",
                      )}
                    >
                      {notification.title}
                    </span>
                    {!notification.read && (
                      <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#2B7574]" />
                    )}
                  </div>
                  {notification.body && (
                    <span className="line-clamp-2 text-xs leading-relaxed text-[#0E2931]/50">
                      {notification.body}
                    </span>
                  )}
                  <span className="mt-0.5 text-[11px] text-[#0E2931]/40">
                    {timeAgo(notification.createdAt)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
