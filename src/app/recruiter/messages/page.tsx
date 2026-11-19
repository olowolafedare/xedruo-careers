import { MessagesInbox } from "@/src/components/shared/messages-inbox";
export const instant = false;
export default function RecruiterMessagesPage() {
  return <MessagesInbox audience="employer" />;
}
