/** Options accepted by the `useChats` conversation-list query. */
export interface UseChatsOptions {
  /**
   * Skips the 15s poll while false. The notification provider passes the
   * session state so an anonymous visitor never hits `/chats`.
   */
  enabled?: boolean;
}
