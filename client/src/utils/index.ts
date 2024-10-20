import { account } from "@/config/appwrite";

const isToday = (date: Date) => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

const isYesterday = (date: Date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
};

const isWithinLastWeek = (date: Date) => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return date > weekAgo;
};

export const formatMessageTime = (timestamp: string) => {
  const date = timestamp.includes("GMT")
    ? new Date(timestamp)
    : new Date(timestamp);

  if (isNaN(date.getTime())) {
    return "Invalid date";
  }

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;

  if (isToday(date)) {
    return formattedTime;
  }

  if (isYesterday(date)) {
    return `Yesterday ${formattedTime}`;
  }

  if (isWithinLastWeek(date)) {
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return `${dayNames[date.getDay()]} ${formattedTime}`;
  }

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  if (year !== new Date().getFullYear()) {
    return `${day}/${month}/${year} ${formattedTime}`;
  }
  return `${day}/${month} ${formattedTime}`;
};
export interface SessionData {
    userId: string;
    email: string;
    name: string;
  }
export const verifySession = async (): Promise<SessionData | null> => {
  try {
    const session = await account.getSession("current");

    if (!session) {
      return null;
    }
    const user = await account.get();

    return {
      userId: user.$id,
      email: user.email,
      name: user.name,
    };
  } catch (error) {
    console.error("Session verification error:", error);
    return null;
  }
};
