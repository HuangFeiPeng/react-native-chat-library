export type Nullable<T> = T | null;
export type Undefinable<T> = T | undefined;

export type ContactActionType =
  | 'contact_list'
  | 'group_invite'
  | 'group_member'
  | 'group_member_modify'
  | 'block_contact'
  | 'create_conversation'
  | 'create_group';

export type SearchActionType = 'add_contact' | 'join_public_group';

export type NotificationMessageType =
  | 'ContactInvitation'
  | 'GroupInvitation'
  | 'GroupRequestJoin';
export type NotificationMessageDescriptionType =
  | 'ContactInvitation'
  | 'ContactInvitationAccepted'
  | 'ContactInvitationDeclined'
  | 'GroupInvitation'
  | 'GroupInvitationAccepted'
  | 'GroupInvitationDeclined'
  | 'GroupRequestJoin'
  | 'GroupRequestJoinAccepted'
  | 'GroupRequestJoinDeclined';
