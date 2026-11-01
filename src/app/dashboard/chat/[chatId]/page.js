import ChatView from "@/components/ChatView/ChatView";

// In Next 16, params is a Promise
export default async function ChatPage({ params }) {
  const { chatId } = await params;
  return <ChatView chatId={chatId} />;
}
