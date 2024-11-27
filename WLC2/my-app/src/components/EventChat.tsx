import React, { useEffect, useState } from 'react';
import { CometChat } from '@cometchat-pro/chat';
import styled from 'styled-components';

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 400px;
  border: 1px solid #ccc;
  border-radius: 8px;
  overflow: hidden;
`;

const MessagesContainer = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  padding: 10px;
  background-color: #f9f9f9;
`;

const MessageInputContainer = styled.div`
  display: flex;
  padding: 10px;
  background-color: #fff;
  border-top: 1px solid #ccc;
`;

const MessageInput = styled.input`
  flex-grow: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-right: 10px;
`;

const SendButton = styled.button`
  padding: 8px 16px;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #0056b3;
  }
`;

interface EventChatProps {
  groupId: string;
}

const EventChat: React.FC<EventChatProps> = ({ groupId }) => {
  const [messages, setMessages] = useState<CometChat.TextMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const checkInitialization = async () => {
      try {
        if (typeof CometChat !== 'undefined') {
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Error checking CometChat initialization:', error);
      }
    };
    checkInitialization();
  }, []);

  useEffect(() => {
    if (!isInitialized || !groupId) return;

    const fetchMessages = async () => {
      try {
        const messagesRequest = new CometChat.MessagesRequestBuilder()
          .setGUID(groupId)
          .setLimit(50)
          .build();

        const fetchedMessages = await messagesRequest.fetchPrevious();
        const textMessages = fetchedMessages.filter(
          (msg): msg is CometChat.TextMessage => msg instanceof CometChat.TextMessage
        ) as CometChat.TextMessage[];
        setMessages(textMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();

    const listenerID = `listener_${groupId}`;
    CometChat.addMessageListener(
      listenerID,
      new CometChat.MessageListener({
        onTextMessageReceived: (message: CometChat.TextMessage) => {
          setMessages((prevMessages) => [...prevMessages, message]);
        },
      })
    );

    return () => {
      CometChat.removeMessageListener(listenerID);
    };
  }, [groupId, isInitialized]);

  const sendMessage = async () => {
    if (newMessage.trim() === '') return;

    const textMessage = new CometChat.TextMessage(
      groupId,
      newMessage,
      CometChat.RECEIVER_TYPE.GROUP
    );

    try {
      const sentMessage = await CometChat.sendMessage(textMessage) as CometChat.TextMessage;
      setMessages((prevMessages) => [...prevMessages, sentMessage]);
      setNewMessage('');
    } catch (error) {
      console.error('Message sending failed:', error);
    }
  };

  if (!isInitialized) {
    return <div>Initializing chat...</div>;
  }

  return (
    <ChatContainer>
      <MessagesContainer>
        {messages.map((msg) => (
          <div key={msg.getId()}>{msg.getText()}</div>
        ))}
      </MessagesContainer>
      <MessageInputContainer>
        <MessageInput
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <SendButton onClick={sendMessage}>Send</SendButton>
      </MessageInputContainer>
    </ChatContainer>
  );
};

export default EventChat;
