// NavIcons.js
import React from 'react';

export const ProfileIcon = ({ active = false }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M16 9C16 11.2091 14.2091 13 12 13C9.79086 13 8 11.2091 8 9C8 6.79086 9.79086 5 12 5C14.2091 5 16 6.79086 16 9ZM14 9C14 10.1046 13.1046 11 12 11C10.8954 11 10 10.1046 10 9C10 7.89543 10.8954 7 12 7C13.1046 7 14 7.89543 14 9ZM12 14C9.34903 14 6.84629 15.1786 5.11215 17.2206C4.26316 18.207 5.21352 20 6.63233 20H17.3677C18.7865 20 19.7368 18.207 18.8879 17.2206C17.1537 15.1786 14.651 14 12 14Z"
      fill={active ? "currentColor" : "currentColor"}
      opacity={active ? 1 : 0.6}
    />
  </svg>
);

/**
 * Telegram-like Exchange icon (24x24)
 * Uses currentColor (цвет задаёт CSS), как в нормальных таббарах
 */
export const ExchangeIcon = ({ active = false }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M7 7h11m0 0-2.5-2.5M18 7l-2.5 2.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={active ? 1 : 0.9}
    />
    <path
      d="M17 17H6m0 0 2.5 2.5M6 17l2.5-2.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={active ? 1 : 0.9}
    />
  </svg>
);

export const HistoryIcon = ({ active = false }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3ZM13 7C13 6.44772 12.5523 6 12 6C11.4477 6 11 6.44772 11 7V12C11 12.2652 11.1054 12.5196 11.2929 12.7071L14.2929 15.7071C14.6834 16.0976 15.3166 16.0976 15.7071 15.7071C16.0976 15.3166 16.0976 14.6834 15.7071 14.2929L13 11.5858V7Z"
      fill="currentColor"
      opacity={active ? 1 : 0.6}
    />
  </svg>
);

// iOS icons оставил, но они тоже на currentColor — так правильнее
export const ProfileIconIOS = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
      fill="currentColor"
      opacity={active ? 1 : 0.6}
    />
  </svg>
);

export const ExchangeIconIOS = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M16 17.01V10H14V17.01H11L15 21L19 17.01H16ZM9 3L5 6.99H8V14H10V6.99H13L9 3Z"
      fill="currentColor"
      opacity={active ? 1 : 0.9}
    />
  </svg>
);

export const HistoryIconIOS = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M11.99 2C6.47 2 2 6.48 2 12C2 17.52 6.47 22 11.99 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 11.99 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20Z"
      fill="currentColor"
      opacity={active ? 1 : 0.6}
    />
    <path
      d="M12.5 7H11V13L16.25 16.15L17 14.92L12.5 12.25V7Z"
      fill="currentColor"
      opacity={active ? 1 : 0.6}
    />
  </svg>
);
