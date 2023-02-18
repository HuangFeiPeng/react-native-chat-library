export type ToastEvent = 'toast_';
export type AlertEvent = 'alert_';
export type SheetEvent = 'sheet_';
export type PressEvent = 'press' | 'long_press';
export type MessageEvent = 'message';
export type ConversationEvent = 'conversion';

export const CreateGroupSettingsEvent = 'CreateGroupSettingsEvent';
export type CreateGroupSettingsEventType =
  | 'set_public'
  | 'set_invite'
  | 'create_new_group';

export const ContactListEvent = 'ContactListEvent';
export type ContactListEventType =
  | ToastEvent
  | AlertEvent
  | SheetEvent
  | 'create_group_result'
  | 'create_group_result_fail';

export const GroupInfoEvent = 'GroupInfoEvent';
export type GroupInfoEventType = 'destroy_group';

export const ConversationListEvent = 'ConversationListEvent';
export type ConversationListEventType =
  | ToastEvent
  | AlertEvent
  | SheetEvent
  | PressEvent
  | MessageEvent
  | ConversationEvent
  | 'create_conversation';
