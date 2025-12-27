import { create } from 'zustand';

export interface PubSubMessage {
    id: string;
    topic: string;
    payload: any;
    timestamp: string;
}

interface PubSubStore {
    messages: PubSubMessage[];
    latestMessagesByTopic: Record<string, PubSubMessage>;
    topics: string[];
    subscriptions: string[];
    addMessage: (topic: string, payload: any) => void;
    clearMessages: () => void;
    toggleSubscription: (topic: string) => void;
}

export const usePubSubStore = create<PubSubStore>((set) => ({
    messages: [],
    latestMessagesByTopic: {},
    topics: [],
    subscriptions: [], // Start with no subscriptions - user must manually subscribe
    addMessage: (topic, payload) => set((state) => {
        // Always track topics, even if not subscribed
        const newTopics = state.topics.includes(topic)
            ? state.topics
            : [...state.topics, topic].sort();

        // Only store message data if subscribed
        const isSubscribed = state.subscriptions.includes('#') ||
            state.subscriptions.includes(topic) ||
            state.subscriptions.some(sub => sub.endsWith('/#') && topic.startsWith(sub.slice(0, -2)));

        if (!isSubscribed) {
            return { topics: newTopics };
        }

        const newMessage: PubSubMessage = {
            id: Math.random().toString(36).substring(7),
            topic,
            payload,
            timestamp: new Date().toISOString(),
        };

        // Keep only last 50 messages
        const newMessages = [newMessage, ...state.messages].slice(0, 50);

        // Update latest message for this topic
        const newLatestMessages = {
            ...state.latestMessagesByTopic,
            [topic]: newMessage
        };

        return {
            messages: newMessages,
            topics: newTopics,
            latestMessagesByTopic: newLatestMessages
        };
    }),
    clearMessages: () => set({ messages: [], topics: [], latestMessagesByTopic: {} }),
    toggleSubscription: (topic) => set((state) => {
        const isSubscribed = state.subscriptions.includes(topic);
        const newSubscriptions = isSubscribed
            ? state.subscriptions.filter(t => t !== topic)
            : [...state.subscriptions, topic];
        return { subscriptions: newSubscriptions };
    }),
}));
