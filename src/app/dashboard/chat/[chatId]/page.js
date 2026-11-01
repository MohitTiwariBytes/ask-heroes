import ChatView from "@/components/ChatView/ChatView";

export default async function ChatPage({ params }) {
  const { chatId } = await params;
  return <ChatView chatId={chatId} />;
}
