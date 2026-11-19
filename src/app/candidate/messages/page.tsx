import { MessagesInbox } from "@/src/components/shared/messages-inbox";
export const instant = false;
export default function CandidateMessagesPage() {
  return <MessagesInbox audience="candidate" />;
}
