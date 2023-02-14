import type { MaterialTopTabScreenProps } from '@react-navigation/material-top-tabs';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import {
  ChatContactEventListener,
  ChatConversationType,
  ChatCustomMessageBody,
  ChatMessage,
  ChatMessageChatType,
  ChatMessageType,
  ChatSearchDirection,
} from 'react-native-chat-sdk';
import {
  Blank,
  Button,
  createStyleSheet,
  EqualHeightList,
  EqualHeightListItemComponent,
  EqualHeightListItemData,
  EqualHeightListRef,
  getScaleFactor,
  LocalIcon,
} from 'react-native-chat-uikit';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DefaultAvatar } from '../components/DefaultAvatars';
import { ListItemSeparator } from '../components/ListItemSeparator';
import { useAppI18nContext } from '../contexts/AppI18nContext';
import { useAppChatSdkContext } from '../contexts/AppImSdkContext';
import { useStyleSheet } from '../hooks/useStyleSheet';
import type { RootParamsList } from '../routes';
import type { NotificationMessageDescriptionType } from '../types';

type Props = MaterialTopTabScreenProps<RootParamsList>;

type ItemDataType = EqualHeightListItemData & {
  msgId: string;
  notificationID: string;
  from: string;
  group?: string;
  timestamp: number;
  onAction?: (isAccepted: boolean, item: ItemDataType) => void;
  notificationType: NotificationMessageDescriptionType;
};

const Buttons = React.memo(({ item }: { item: ItemDataType }) => {
  const { requestList } = useAppI18nContext();
  const sf = getScaleFactor();
  const disabled = true;
  if (
    item.notificationType === 'ContactInvitationAccepted' ||
    item.notificationType === 'GroupRequestJoinAccepted' ||
    item.notificationType === 'GroupInvitationAccepted'
  ) {
    return (
      <Button
        disabled={disabled}
        style={{
          alignSelf: 'flex-end',
          height: sf(28),
          borderRadius: sf(14),
        }}
        color={{
          disabled: {
            content: '#CCCCCC',
            background: '#E6E6E6',
          },
        }}
      >
        <Text style={{ color: 'white', marginHorizontal: sf(8) }}>
          {requestList.button[1]}
        </Text>
      </Button>
    );
  } else if (
    item.notificationType === 'ContactInvitationDeclined' ||
    item.notificationType === 'GroupRequestJoinDeclined' ||
    item.notificationType === 'GroupInvitationDeclined'
  ) {
    return (
      <Button
        disabled={disabled}
        style={{
          alignSelf: 'flex-end',
          height: sf(28),
          borderRadius: sf(14),
        }}
        color={{
          disabled: {
            content: '#CCCCCC',
            background: '#E6E6E6',
          },
        }}
      >
        <Text style={{ color: 'white', marginHorizontal: sf(8) }}>
          {requestList.button[2]}
        </Text>
      </Button>
    );
  } else {
    return (
      <React.Fragment>
        <Button
          style={{
            alignSelf: 'flex-end',
            height: sf(28),
            borderRadius: sf(14),
          }}
          onPress={() => item.onAction?.(true, item)}
        >
          <Text style={{ color: 'white', marginHorizontal: sf(8) }}>
            {requestList.button[0]}
          </Text>
        </Button>
        <Pressable onPress={() => item.onAction?.(false, item)}>
          <LocalIcon
            name="xmark_thick"
            color="black"
            style={{ alignSelf: 'flex-end', marginLeft: sf(15) }}
          />
        </Pressable>
      </React.Fragment>
    );
  }
});

const Item: EqualHeightListItemComponent = (props) => {
  const sf = getScaleFactor();
  const { requestList } = useAppI18nContext();
  const item = props.data as ItemDataType;

  return (
    <View style={styles.item}>
      <View
        style={{
          flex: 1,
          // backgroundColor: 'red',
          // height: '100%',
          // width: '100%',
          // minHeight: '100%',
          flexGrow: 1,
          // flexShrink: 0,
        }}
      >
        <View style={styles.item2}>
          <DefaultAvatar size={sf(50)} radius={sf(25)} />
          <View style={styles.itemText}>
            <Text
              style={{
                fontSize: 16,
                lineHeight: 24,
                fontWeight: '500',
                paddingBottom: 5,
              }}
            >
              {item.notificationID}
            </Text>
            <Text
              style={{
                flexWrap: 'wrap',
                maxWidth: '95%',
                // backgroundColor: 'red',
              }}
            >
              {requestList.description({
                type: item.notificationType,
                user: item.from,
                group: item.group,
              })}
            </Text>
          </View>
        </View>
        <View style={styles.item3}>
          <Buttons item={item} />
        </View>
      </View>
    </View>
  );
};

export default function RequestListScreen(_props: Props): JSX.Element {
  console.log('test:RequestListScreen:');
  const sf = getScaleFactor();
  // const theme = useThemeContext();
  // const menu = useActionMenu();
  // const sheet = useBottomSheet();
  const { client } = useAppChatSdkContext();

  const listRef = React.useRef<EqualHeightListRef>(null);
  const enableRefresh = true;
  const enableAlphabet = false;
  const enableHeader = false;
  const data: ItemDataType[] = [];
  const [isEmpty, setIsEmpty] = React.useState(false);

  const updateDataThen = React.useCallback(
    (
      isAccepted: boolean,
      item: ItemDataType,
      onResult: (result: boolean, body?: ChatCustomMessageBody) => void
    ): void => {
      client.chatManager
        .getMessage(item.msgId)
        .then((result) => {
          console.log('test:result:', result);
          if (result) {
            const body = result.body as ChatCustomMessageBody;
            if (
              body.params.type === 'ContactInvitationAccepted' ||
              body.params.type === 'ContactInvitationDeclined' ||
              body.params.type === 'GroupRequestJoinAccepted' ||
              body.params.type === 'GroupRequestJoinDeclined' ||
              body.params.type === 'GroupInvitationAccepted' ||
              body.params.type === 'GroupInvitationDeclined'
            ) {
              return;
            }
            if (body.event === 'ContactInvitation') {
              body.params.type =
                isAccepted === true
                  ? 'ContactInvitationAccepted'
                  : 'ContactInvitationDeclined';
            } else if (body.event === 'GroupRequestJoin') {
              body.params.type =
                isAccepted === true
                  ? 'GroupRequestJoinAccepted'
                  : 'GroupRequestJoinDeclined';
            } else if (body.event === 'GroupInvitation') {
              body.params.type =
                isAccepted === true
                  ? 'GroupInvitationAccepted'
                  : 'GroupInvitationDeclined';
            } else {
              return;
            }
            client.chatManager
              .updateMessage(result)
              .then(() => {
                console.log('test:result:success');
                onResult?.(true, body);
                if (
                  body.params.type === 'ContactInvitationAccepted' ||
                  body.params.type === 'ContactInvitationDeclined'
                ) {
                  if (body.params.type === 'ContactInvitationAccepted') {
                    client.contactManager.acceptInvitation(body.params.from);
                  } else {
                    client.contactManager.declineInvitation(body.params.from);
                  }
                } else if (
                  body.params.type === 'GroupRequestJoinAccepted' ||
                  body.params.type === 'GroupRequestJoinDeclined'
                ) {
                  if (body.params.type === 'GroupRequestJoinAccepted') {
                    client.groupManager.acceptJoinApplication(
                      body.params.groupId,
                      body.params.from
                    );
                  } else {
                    client.groupManager.declineJoinApplication(
                      body.params.groupId,
                      body.params.from
                    );
                  }
                } else if (
                  body.params.type === 'GroupInvitationAccepted' ||
                  body.params.type === 'GroupInvitationDeclined'
                ) {
                  if (body.params.type === 'GroupInvitationAccepted') {
                    client.groupManager.acceptInvitation(
                      body.params.groupId,
                      body.params.from
                    );
                  } else {
                    client.groupManager.declineInvitation(
                      body.params.groupId,
                      body.params.from
                    );
                  }
                }
              })
              .catch((error) => {
                console.warn('test:error:', error);
                onResult?.(false, body);
              });
          }
        })
        .catch((error) => {
          console.warn('test:error:', error);
        });
    },
    [client.chatManager, client.contactManager, client.groupManager]
  );

  const updateDataAwait = React.useCallback(
    async (
      isAccepted: boolean,
      item: ItemDataType
    ): Promise<{ body: ChatCustomMessageBody } | undefined> => {
      try {
        const result = await client.chatManager.getMessage(item.msgId);
        if (result) {
          let body = result.body as ChatCustomMessageBody;

          if (
            body.params.type === 'ContactInvitationAccepted' ||
            body.params.type === 'ContactInvitationDeclined' ||
            body.params.type === 'GroupRequestJoinAccepted' ||
            body.params.type === 'GroupRequestJoinDeclined' ||
            body.params.type === 'GroupInvitationAccepted' ||
            body.params.type === 'GroupInvitationDeclined'
          ) {
            return undefined;
          }

          if (body.event === 'ContactInvitation') {
            body.params.type =
              isAccepted === true
                ? 'ContactInvitationAccepted'
                : 'ContactInvitationDeclined';
          } else if (body.event === 'GroupRequestJoin') {
            body.params.type =
              isAccepted === true
                ? 'GroupRequestJoinAccepted'
                : 'GroupRequestJoinDeclined';
          } else if (body.event === 'GroupInvitation') {
            body.params.type =
              isAccepted === true
                ? 'GroupInvitationAccepted'
                : 'GroupInvitationDeclined';
          } else {
            return undefined;
          }
          await client.chatManager.updateMessage(result);

          if (
            body.params.type === 'ContactInvitationAccepted' ||
            body.params.type === 'ContactInvitationDeclined'
          ) {
            if (body.params.type === 'ContactInvitationAccepted') {
              await client.contactManager.acceptInvitation(body.params.from);
            } else {
              await client.contactManager.declineInvitation(body.params.from);
            }
          } else if (
            body.params.type === 'GroupRequestJoinAccepted' ||
            body.params.type === 'GroupRequestJoinDeclined'
          ) {
            if (body.params.type === 'GroupRequestJoinAccepted') {
              client.groupManager.acceptJoinApplication(
                body.params.groupId,
                body.params.from
              );
            } else {
              client.groupManager.declineJoinApplication(
                body.params.groupId,
                body.params.from
              );
            }
          } else if (
            body.params.type === 'GroupInvitationAccepted' ||
            body.params.type === 'GroupInvitationDeclined'
          ) {
            if (body.params.type === 'GroupInvitationAccepted') {
              client.groupManager.acceptInvitation(
                body.params.groupId,
                body.params.from
              );
            } else {
              client.groupManager.declineInvitation(
                body.params.groupId,
                body.params.from
              );
            }
          }

          return {
            body: body,
          };
        } else {
          return undefined;
        }
      } catch (error) {
        console.warn('test:error:555:', error);
        return undefined;
      }
    },
    [client.chatManager, client.contactManager, client.groupManager]
  );

  const standardizedData = React.useCallback(
    (data: Omit<ItemDataType, 'onAction'>): ItemDataType => {
      return {
        ...data,
        onAction: async (isAccepted: boolean, item: ItemDataType) => {
          const select = 'await' as 'then' | 'await';
          if (select === 'then') {
            updateDataThen(isAccepted, item, (_, body) => {
              listRef.current?.manualRefresh([
                {
                  type: 'update',
                  enableSort: false,
                  data: [
                    {
                      ...item,
                      notificationType: body!.params.type,
                    } as EqualHeightListItemData,
                  ],
                },
              ]);
            });
          } else if (select === 'await') {
            const ret = await updateDataAwait(isAccepted, item);
            if (ret === undefined) {
              return;
            }
            const { body } = ret;
            if (body === undefined) {
              return;
            }
            listRef.current?.manualRefresh([
              {
                type: 'update',
                enableSort: false,
                data: [
                  {
                    ...item,
                    notificationType: body.params.type,
                  } as EqualHeightListItemData,
                ],
              },
            ]);
          }
        },
      };
    },
    [updateDataThen, updateDataAwait]
  );

  const initData = React.useCallback(
    (
      list: {
        msgId: string;
        timestamp: number;
        notificationID: string;
        from: string;
        group?: string;
        notificationType: NotificationMessageDescriptionType;
      }[]
    ) => {
      const r = list.map((value) => {
        return standardizedData({
          key: value.timestamp.toString(),
          timestamp: value.timestamp,
          msgId: value.msgId,
          notificationID: value.notificationID,
          from: value.from,
          group: value.group,
          notificationType: value.notificationType,
        });
      });
      // data.push(...r);
      listRef.current?.manualRefresh([
        {
          type: 'clear',
        },
        {
          type: 'add',
          data: r,
          enableSort: true,
          sortDirection: 'dsc',
        },
      ]);
    },
    [standardizedData]
  );

  const initList = React.useCallback(async () => {
    const convId = await client.getCurrentUsername();
    if (convId === undefined || convId.length === 0) {
      return;
    }
    client.chatManager
      .getMessagesWithMsgType(
        convId,
        ChatConversationType.PeerChat,
        ChatMessageType.CUSTOM,
        ChatSearchDirection.DOWN
      )
      .then((result) => {
        console.log('test:RequestListScreen:success:', result.length);
        setIsEmpty(result.length === 0);
        initData(
          result.map((item) => {
            const content = (item.body as ChatCustomMessageBody).params;
            return {
              msgId: item.msgId,
              timestamp: item.serverTime,
              notificationID: content.from,
              from: content.from,
              group:
                item.chatType === ChatMessageChatType.GroupChat
                  ? item.conversationId
                  : undefined,
              notificationType: content.type,
            };
          })
        ); // for test
      })
      .catch((error) => {
        console.warn('test:error:', error);
      });
  }, [client, initData]);

  const addListeners = React.useCallback(() => {
    const contactEventListener: ChatContactEventListener = {
      onContactInvited: async (userName: string, reason?: string) => {
        console.log('test:onContactInvited:', userName, reason);
        const convId = await client.getCurrentUsername();
        const msg = ChatMessage.createCustomMessage(
          convId,
          'ContactInvitation',
          ChatMessageChatType.PeerChat,
          {
            params: {
              from: userName,
              type: 'ContactInvitation',
            },
          }
        );
        console.log('test:onContactInvited:', msg);
        client.chatManager
          .insertMessage(msg)
          .then((result) => {
            console.log('test:insertMessage:success:', result);
            listRef.current?.manualRefresh([
              {
                type: 'add',
                enableSort: true,
                sortDirection: 'dsc',
                data: [
                  standardizedData({
                    key: msg.serverTime.toString(),
                    timestamp: msg.serverTime,
                    msgId: msg.msgId,
                    notificationID: userName,
                    from: userName,
                    notificationType:
                      'ContactInvitation' as NotificationMessageDescriptionType,
                  }) as EqualHeightListItemData,
                ],
              },
            ]);
          })
          .catch((error) => {
            console.warn('test:insertMessage:fail:', error);
          });
      },
    };
    client.contactManager.addContactListener(contactEventListener);
    return () => {
      client.contactManager.removeContactListener(contactEventListener);
    };
  }, [client, standardizedData]);

  React.useEffect(() => {
    const load = () => {
      console.log('test:load:', RequestListScreen.name);
      const unsubscribe = addListeners();
      initList();
      return {
        unsubscribe: unsubscribe,
      };
    };
    const unload = (params: { unsubscribe: () => void }) => {
      console.log('test:unload:', RequestListScreen.name);
      params.unsubscribe();
    };

    const res = load();
    return () => unload(res);
  }, [addListeners, initList]);

  return (
    <SafeAreaView
      mode="padding"
      style={useStyleSheet().safe}
      edges={['right', 'left']}
    >
      {isEmpty ? (
        <Blank />
      ) : (
        <EqualHeightList
          parentName="RequestList"
          onLayout={(_) => {
            // console.log(
            //   'test:EqualHeightList:',
            //   event.nativeEvent.layout.height
            // );
          }}
          ref={listRef}
          items={data}
          ItemFC={Item}
          enableAlphabet={enableAlphabet}
          enableRefresh={enableRefresh}
          enableHeader={enableHeader}
          alphabet={{
            alphabetCurrent: {
              backgroundColor: 'orange',
              color: 'white',
            },
            alphabetItemContainer: {
              width: sf(15),
              borderRadius: sf(8),
            },
          }}
          ItemSeparatorComponent={ListItemSeparator}
          onRefresh={(type) => {
            if (type === 'started') {
              initList();
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}
const styles = createStyleSheet({
  item: {
    flex: 1,
    // backgroundColor: 'green',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginVertical: 0,
    marginHorizontal: 0,
    height: 138,
    alignItems: 'center',
    flexDirection: 'row',
  },
  item2: {
    flex: 1,
    // backgroundColor: '#f9c2ff',
    // padding: 20,
    marginVertical: 0,
    marginHorizontal: 0,
    // height: 80,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  item3: {
    // flex: 1,
    // backgroundColor: 'red',
    padding: 5,
    marginVertical: 0,
    marginHorizontal: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    // alignContent: 'flex-end',
  },
  itemText: {
    marginLeft: 10,
    // flexGrow: 1,
  },
});
