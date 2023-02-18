import type {
  MaterialBottomTabNavigationProp,
  MaterialBottomTabScreenProps,
} from '@react-navigation/material-bottom-tabs';
import {
  CompositeNavigationProp,
  CompositeScreenProps,
  useNavigation,
} from '@react-navigation/native';
import type {
  HeaderButtonProps,
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack/lib/typescript/src/types';
import * as React from 'react';
import {
  DeviceEventEmitter,
  Pressable,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  ChatConversationType,
  ChatGroupMessageAck,
  ChatMessage,
  ChatMessageDirection,
  ChatMessageEventListener,
  ChatMessageReactionEvent,
  ChatMessageThreadEvent,
  ChatMessageType,
  ChatTextMessageBody,
} from 'react-native-chat-sdk';
import {
  autoFocus,
  Badge as UIBadge,
  Blank,
  createStyleSheet,
  EqualHeightList,
  EqualHeightListItemComponent,
  EqualHeightListItemData,
  EqualHeightListRef,
  FragmentContainer,
  getScaleFactor,
  LocalIcon,
  messageTimestamp,
  queueTask,
  timestamp,
  useAlert,
  useBottomSheet,
  useThemeContext,
  useToastContext,
} from 'react-native-chat-uikit';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

// import { COUNTRY } from '../__dev__/const';
import { DefaultAvatar } from '../components/DefaultAvatars';
import HomeHeaderTitle from '../components/HomeHeaderTitle';
import { ListItemSeparator } from '../components/ListItemSeparator';
import { ListSearchHeader } from '../components/ListSearchHeader';
import { useAppI18nContext } from '../contexts/AppI18nContext';
import { useAppChatSdkContext } from '../contexts/AppImSdkContext';
import {
  type ConversationListEventType,
  ConversationListEvent,
} from '../events';
import { useStyleSheet } from '../hooks/useStyleSheet';
import type {
  BottomTabParamsList,
  BottomTabScreenParamsList,
  RootParamsList,
  RootScreenParamsList,
} from '../routes';

type RootScreenParamsListOnly = Omit<
  RootScreenParamsList,
  keyof BottomTabScreenParamsList
>;
type Props = CompositeScreenProps<
  MaterialBottomTabScreenProps<BottomTabScreenParamsList, 'ConversationList'>,
  NativeStackScreenProps<RootScreenParamsListOnly>
>;

type NavigationProp = CompositeNavigationProp<
  MaterialBottomTabNavigationProp<
    BottomTabScreenParamsList<BottomTabParamsList, 'option'>,
    any,
    undefined
  >,
  NativeStackNavigationProp<
    RootScreenParamsList<RootParamsList, 'option'>,
    any,
    undefined
  >
>;

type SheetEvent = 'sheet_conversation_list' | 'sheet_navigation_menu';

type ItemDataType = EqualHeightListItemData & {
  convId: string;
  convType: ChatConversationType;
  lastMsg?: ChatMessage;
  convContent: string;
  timestamp: number;
  timestampS: string;
  count: number;
  actions?: {
    onMute?: (data: ItemDataType) => void;
    onDelete?: (data: ItemDataType) => void;
  };
};

const Item: EqualHeightListItemComponent = (props) => {
  const sf = getScaleFactor();
  const item = props.data as ItemDataType;
  const { width: screenWidth } = useWindowDimensions();
  const extraWidth = item.sideslip?.width ?? sf(100);
  // console.log('test:width:', screenWidth + extraWidth);
  return (
    <View style={[styles.item, { width: screenWidth + extraWidth }]}>
      <View
        style={{
          // width: screenWidth,
          flexGrow: 1,
          flexShrink: 1,
          flexDirection: 'row',
        }}
      >
        <DefaultAvatar size={sf(50)} radius={sf(25)} />
        <View style={[styles.itemText, { justifyContent: 'space-between' }]}>
          <Text style={{ maxWidth: screenWidth * 0.5 }} numberOfLines={1}>
            {item.convId}
          </Text>
          <Text numberOfLines={1}>{item.convContent}</Text>
        </View>
        <View
          style={{
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexGrow: 1,
          }}
        >
          <Text>MM:HH:MM</Text>
          <UIBadge
            count={10}
            badgeColor="rgba(255, 20, 204, 1)"
            size="default"
          />
        </View>
      </View>
      <View
        style={{
          // flexGrow: 1,
          width: extraWidth, // ??? why
          height: sf(60),
          flexDirection: 'row',
          // backgroundColor: 'green',
          justifyContent: 'flex-start',
          alignItems: 'center',
        }}
      >
        <View style={{ width: sf(20) }} />
        <Pressable
          style={{
            height: sf(30),
            width: sf(30),
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#F2F2F2',
            overflow: 'hidden',
            borderRadius: sf(30),
          }}
          onPress={() => {
            item.actions?.onMute?.(item);
          }}
        >
          <LocalIcon name="bell_slash" size={20} color="#666666" />
        </Pressable>
        <View style={{ width: sf(15) }} />
        <Pressable
          style={{
            height: sf(30),
            width: sf(30),
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 20, 204, 1)',
            overflow: 'hidden',
            borderRadius: sf(30),
          }}
          onPress={() => {
            item.actions?.onDelete?.(item);
          }}
          onStartShouldSetResponder={(_) => {
            return true;
          }}
          onStartShouldSetResponderCapture={(_) => {
            return true;
          }}
          onMoveShouldSetResponder={(_) => {
            return true;
          }}
          onResponderEnd={(_) => {
            return true;
          }}
          onResponderGrant={(_) => {
            return true;
          }}
        >
          <LocalIcon name="trash" size={sf(20)} color="white" />
        </Pressable>
      </View>
    </View>
  );
};

const InvisiblePlaceholder = React.memo(
  ({ data }: { data: ItemDataType[] }) => {
    console.log('test:InvisiblePlaceholder:');
    const sheet = useBottomSheet();
    const toast = useToastContext();
    const alert = useAlert();
    const { conversation } = useAppI18nContext();
    const theme = useThemeContext();
    const sf = getScaleFactor();
    // const { client } = useAppChatSdkContext();

    const navigation = useNavigation<NavigationProp>();

    // const createConversation = React.useCallback(async () => {
    //   console.log('test:createConversation:', data);
    //   const convId = '';
    //   const convType = ChatConversationType.PeerChat;
    //   client.chatManager.getConversation(convId, convType, true).then().catch();
    // }, [client, data]);

    React.useEffect(() => {
      console.log('test:load:111:', ConversationListScreen.name);
      const sub = DeviceEventEmitter.addListener(
        ConversationListEvent,
        (event) => {
          console.log('test:ConversationListEvent:', event);
          switch (event.type as ConversationListEventType) {
            case 'long_press':
              sheet.openSheet({
                sheetItems: [
                  {
                    icon: 'loading',
                    iconColor: theme.colors.primary,
                    title: '1',
                    titleColor: 'black',
                    onPress: () => {
                      console.log('test:onPress:data:', data);
                    },
                  },
                  {
                    icon: 'loading',
                    iconColor: theme.colors.primary,
                    title: '2',
                    titleColor: 'black',
                    onPress: () => {
                      console.log('test:onPress:data:', data);
                    },
                  },
                ],
              });
              break;
            case 'sheet_':
              {
                const eventType = event.params.type as SheetEvent;
                if (eventType === 'sheet_navigation_menu') {
                  sheet.openSheet({
                    sheetItems: [
                      {
                        title: conversation.new,
                        titleColor: 'black',
                        onPress: () => {
                          console.log('test:onPress:data:');
                          // navigation.navigate('ContactList', {
                          //   params: { type: 'create_conversation' },
                          // });
                          navigation.navigate({
                            name: 'ContactList',
                            params: { params: { type: 'create_conversation' } },
                          });
                        },
                      },
                      {
                        title: conversation.createGroup,
                        titleColor: 'black',
                        onPress: () => {
                          console.log('test:onPress:createGroup:');
                          navigation.navigate('ContactList', {
                            params: { type: 'create_group' },
                          });
                        },
                      },
                      {
                        title: conversation.addContact,
                        titleColor: 'black',
                        onPress: () => {
                          console.log('test:onPress:data:');
                          navigation.navigate('Search', {
                            params: { type: 'add_contact' },
                          });
                        },
                      },
                      {
                        title: conversation.joinPublicGroup,
                        titleColor: 'black',
                        onPress: () => {
                          console.log('test:onPress:data:');
                          navigation.navigate('Search', {
                            params: { type: 'join_public_group' },
                          });
                        },
                      },
                    ],
                  });
                }
              }
              break;
            default:
              break;
          }
        }
      );
      return () => {
        console.log('test:unload:222:');
        sub.remove();
      };
    }, [
      toast,
      sheet,
      alert,
      navigation,
      theme.colors.primary,
      data,
      sf,
      conversation.new,
      conversation.createGroup,
      conversation.addContact,
      conversation.joinPublicGroup,
    ]);

    return <></>;
  }
);

let count = 0;
export default function ConversationListScreen({
  navigation,
}: Props): JSX.Element {
  // console.log('test:ConversationListScreen:', navigation);
  // return <Placeholder content={`${ConversationListScreen.name}`} />;
  // console.log('test:GroupListScreen:', route, navigation);
  const sf = getScaleFactor();
  // const theme = useThemeContext();
  // const menu = useActionMenu();
  // const sheet = useBottomSheet();
  // const { conversation } = useAppI18nContext();
  const { client } = useAppChatSdkContext();

  const listRef = React.useRef<EqualHeightListRef>(null);
  const enableRefresh = true;
  const enableAlphabet = false;
  const enableHeader = true;
  // const autoFocus = false;
  const data: ItemDataType[] = React.useMemo(() => [], []); // for search
  // const width = sf(100);
  const isEmpty = false;
  const currentChatId = React.useRef('');

  const getConvId = React.useCallback((msg: ChatMessage) => {
    if (msg.direction === ChatMessageDirection.SEND) {
      return msg.to;
    } else {
      return msg.from;
    }
  }, []);

  const getContent = React.useCallback((msg?: ChatMessage) => {
    if (msg) {
      let content = '';
      switch (msg.body.type) {
        case ChatMessageType.TXT:
          content = (msg.body as ChatTextMessageBody).content;
          break;
        case ChatMessageType.CMD:
          content = '[cmd]';
          break;
        case ChatMessageType.CUSTOM:
          content = '[custom]';
          break;
        case ChatMessageType.FILE:
          content = '[file]';
          break;
        case ChatMessageType.IMAGE:
          content = '[image]';
          break;
        case ChatMessageType.LOCATION:
          content = '[location]';
          break;
        case ChatMessageType.VIDEO:
          content = '[video]';
          break;
        case ChatMessageType.VOICE:
          content = '[voice]';
          break;
        default:
          break;
      }
      return content;
    }
    return '';
  }, []);

  // const updateConvCount = React.useCallback(
  //   (conv: ItemDataType, newMsg: ChatMessage) => {
  //     let count = conv.count;
  //     if (conv.convId === currentChatId.current) {
  //       count = 0;
  //     } else {
  //       if (newMsg.direction === ChatMessageDirection.SEND) {
  //         count = conv.count ?? 0;
  //       } else {
  //         count = conv.count === undefined ? 1 : conv.count + 1;
  //       }
  //     }
  //     return count;
  //   },
  //   []
  // );

  // const hadExisted = React.useCallback(
  //   (convId: string) => {
  //     for (const item of data) {
  //       if (item.convId === convId) {
  //         return true;
  //       }
  //     }
  //     return false;
  //   },
  //   [data]
  // );

  const getExisted = React.useCallback(
    (convId: string) => {
      for (const item of data) {
        if (item.convId === convId) {
          return item;
        }
      }
      return undefined;
    },
    [data]
  );

  const getConvCount = React.useCallback(
    (convId: string, newMsg?: ChatMessage) => {
      let conv;
      for (const item of data) {
        if (item.convId === convId) {
          conv = item;
        }
      }
      if (conv) {
        if (conv.convId === currentChatId.current) {
          return 0;
        } else {
          if (newMsg === undefined) {
            return conv.count;
          }
          if (newMsg.direction === ChatMessageDirection.SEND) {
            return conv.count;
          } else {
            return conv.count + 1;
          }
        }
      } else {
        return 0;
      }
    },
    [data]
  );

  const removeConversation = React.useCallback(
    (convId: string) => {
      client.chatManager
        .deleteConversation(convId, true)
        .then((result) => {
          console.log('test:result:', result);
        })
        .catch((error) => {
          console.warn('test:error:', error);
        });
    },
    [client.chatManager]
  );

  const manualRefresh = React.useCallback(
    (params: {
      type: 'init' | 'add' | 'search' | 'del-one' | 'update-one';
      items: ItemDataType[];
    }) => {
      console.log('test:useCallback:manualRefresh:');
      if (params.type === 'init') {
        data.length = 0;
        listRef.current?.manualRefresh([
          {
            type: 'clear',
          },
          {
            type: 'add',
            data: params.items as EqualHeightListItemData[],
            enableSort: true,
            sortDirection: 'asc',
          },
        ]);
        data.push(...params.items);
      } else if (params.type === 'search') {
        listRef.current?.manualRefresh([
          {
            type: 'clear',
          },
          {
            type: 'add',
            data: params.items as EqualHeightListItemData[],
            enableSort: true,
            sortDirection: 'asc',
          },
        ]);
      } else if (params.type === 'add') {
        listRef.current?.manualRefresh([
          {
            type: 'add',
            data: params.items as EqualHeightListItemData[],
            enableSort: true,
            sortDirection: 'asc',
          },
        ]);
        data.push(...params.items);
      } else if (params.type === 'del-one') {
        listRef.current?.manualRefresh([
          {
            type: 'del',
            data: params.items as EqualHeightListItemData[],
            enableSort: false,
          },
        ]);
        let hadDeleted = false;
        for (let index = 0; index < data.length; index++) {
          const element = data[index];
          for (const item of params.items) {
            if (element && item.key === element.key) {
              data.splice(index, 1);
              hadDeleted = true;
              break;
            }
          }
          if (hadDeleted === true) {
            break;
          }
        }
      } else if (params.type === 'update-one') {
        listRef.current?.manualRefresh([
          {
            type: 'update',
            data: params.items as EqualHeightListItemData[],
            enableSort: true,
            sortDirection: 'asc',
          },
        ]);
        let hadUpdated = false;
        for (let index = 0; index < data.length; index++) {
          const element = data[index];
          for (const item of params.items) {
            if (element && item.key === element.key) {
              data[index] = item;
              hadUpdated = true;
              break;
            }
          }
          if (hadUpdated === true) {
            break;
          }
        }
      } else {
        console.warn('test:');
        return;
      }
    },
    [data]
  );

  const standardizedData = React.useCallback(
    (item: Omit<ItemDataType, 'onLongPress' | 'onPress'>): ItemDataType => {
      console.log('test:useCallback:standardizedData:');
      const time = item.lastMsg ? item.lastMsg.serverTime : timestamp();
      const r = {
        ...item,
        convContent: getContent(item.lastMsg),
        timestamp: time,
        timestampS: messageTimestamp(time),
        type: 'sideslip',
        sideslip: {
          width: sf(100),
        },
        onLongPress: (_: ItemDataType) => {
          DeviceEventEmitter.emit(ConversationListEvent, {
            type: 'long_press' as ConversationListEventType,
            params: {
              type: 'sheet_conversation_list' as SheetEvent,
              content: {},
            },
          });
        },
        onPress: (data: ItemDataType) => {
          navigation.navigate('Chat', {
            params: { chatId: data.convId, chatType: data.convType },
          });
        },
        actions: {
          onMute: (_) => {},
          onDelete: (data) => {
            manualRefresh({
              type: 'del-one',
              items: [{ ...data } as ItemDataType],
            });
            removeConversation(data.convId);
          },
        },
      } as ItemDataType;
      return r;
    },
    [getContent, manualRefresh, navigation, removeConversation, sf]
  );

  const getConvIfNot = React.useCallback(
    async (convId: string, convType: ChatConversationType) => {
      for (const item of data) {
        if (item.convId === convId) {
          return item;
        }
      }
      try {
        const conv = await client.chatManager.getConversation(
          convId,
          convType,
          true
        );
        if (conv) {
          const msg = await conv.getLatestMessage();
          if (msg) {
            return standardizedData({
              key: conv.convId,
              convId: conv.convId,
              convType: conv.convType,
              lastMsg: msg,
              count: getConvCount(conv.convId),
            } as ItemDataType);
          } else {
            return standardizedData({
              key: conv.convId,
              convId: conv.convId,
              convType: conv.convType,
              lastMsg: undefined,
              count: 0,
            } as ItemDataType);
          }
        } else {
          return undefined;
        }
      } catch (error) {
        return undefined;
      }
    },
    [client.chatManager, data, getConvCount, standardizedData]
  );

  const NavigationHeaderRight: React.FunctionComponent<HeaderButtonProps> =
    React.useCallback(
      (_: HeaderButtonProps) => {
        return (
          <Pressable
            onPress={() => {
              console.log('test:NavigationHeaderRight:onPress:');
              DeviceEventEmitter.emit(ConversationListEvent, {
                type: 'sheet_' as ConversationListEventType,
                params: {
                  type: 'sheet_navigation_menu' as SheetEvent,
                  content: {},
                },
              });
            }}
          >
            <View style={{ padding: sf(10), marginRight: -sf(10) }}>
              <LocalIcon
                name="chat_nav_add"
                style={{ padding: 0 }}
                size={sf(20)}
              />
            </View>
          </Pressable>
        );
      },
      [sf]
    );

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      navigation.getParent()?.setOptions({
        headerBackVisible: false,
        headerRight: NavigationHeaderRight,
        headerTitle: () => <HomeHeaderTitle name="Chats" />,
        headerShadowVisible: false,
        headerBackTitleVisible: false,
      });
    });
    return unsubscribe;
  }, [NavigationHeaderRight, navigation]);

  const addListeners = React.useCallback(() => {
    const sub = DeviceEventEmitter.addListener(
      ConversationListEvent,
      (event) => {
        const eventType = event.type as ConversationListEventType;
        switch (eventType) {
          case 'create_conversation':
            {
              const eventParams = event.params;
              manualRefresh({
                type: 'add',
                items: [
                  standardizedData({
                    ...eventParams,
                  }),
                ],
              });
            }
            break;
          default:
            break;
        }
      }
    );
    const msgListener: ChatMessageEventListener = {
      onMessagesReceived: async (messages: ChatMessage[]): Promise<void> => {
        /// todo: !!! 10000 message count ???
        for (const msg of messages) {
          const convId = getConvId(msg);
          const convType = msg.chatType as number as ChatConversationType;
          const conv = getExisted(convId);
          if (conv === undefined) {
            await getConvIfNot(convId, convType);
          }
          manualRefresh({
            type: 'update-one',
            items: [
              standardizedData({
                key: convId,
                convId: convId,
                convType: convType,
                lastMsg: msg,
                count: getConvCount(convId, msg),
              } as ItemDataType),
            ],
          });
        }
      },

      onCmdMessagesReceived: (_: ChatMessage[]): void => {},

      onMessagesRead: async (messages: ChatMessage[]): Promise<void> => {
        /// todo: !!! 10000 message count ???
        for (const msg of messages) {
          const convId = getConvId(msg);
          const convType = msg.chatType as number as ChatConversationType;
          const conv = getExisted(convId);
          if (conv === undefined) {
            return;
          }
          const count = await client.chatManager.getConversationUnreadCount(
            convId,
            convType
          );
          manualRefresh({
            type: 'update-one',
            items: [
              standardizedData({
                key: convId,
                convId: convId,
                convType: convType,
                lastMsg: msg,
                count: count,
              } as ItemDataType),
            ],
          });
        }
      },

      onGroupMessageRead: (_: ChatGroupMessageAck[]): void => {},

      onMessagesDelivered: (_: ChatMessage[]): void => {},

      onMessagesRecalled: (_: ChatMessage[]): void => {},

      onConversationsUpdate: (): void => {},

      onConversationRead: (): void => {},

      onMessageReactionDidChange: (_: ChatMessageReactionEvent[]): void => {},

      onChatMessageThreadCreated: (_: ChatMessageThreadEvent): void => {},

      onChatMessageThreadUpdated: (_: ChatMessageThreadEvent): void => {},

      onChatMessageThreadDestroyed: (_: ChatMessageThreadEvent): void => {},

      onChatMessageThreadUserRemoved: (_: ChatMessageThreadEvent): void => {},
    };
    client.chatManager.addMessageListener(msgListener);
    return () => {
      sub.remove();
      client.chatManager.removeMessageListener(msgListener);
    };
  }, [
    client.chatManager,
    getConvCount,
    getConvId,
    getConvIfNot,
    getExisted,
    manualRefresh,
    standardizedData,
  ]);

  const initList = React.useCallback(() => {
    client.chatManager
      .getAllConversations()
      .then((result) => {
        console.log('test:result:', result);
        if (result) {
          const r = result.map((value) => {
            return standardizedData({
              key: value.convId,
              convId: value.convId,
              convType: value.convType,
              timestamp: timestamp(),
              lastMsg: undefined,
              convContent: '',
              count: 0,
            } as ItemDataType);
          });
          manualRefresh({ type: 'init', items: r });
        }
      })
      .catch((error) => {
        console.warn('test:error:', error);
      });
  }, [client.chatManager, manualRefresh, standardizedData]);

  React.useEffect(() => {
    console.log('test:useEffect:', addListeners, initList);
    const load = () => {
      console.log('test:load:', ConversationListScreen.name);
      const unsubscribe = addListeners();
      initList();
      return {
        unsubscribe: unsubscribe,
      };
    };
    const unload = (params: { unsubscribe: () => void }) => {
      console.log('test:unload:', ConversationListScreen.name);
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
        <React.Fragment>
          <ListSearchHeader
            autoFocus={autoFocus()}
            onChangeText={(text) => {
              console.log('test:ListSearchHeader:onChangeText:', Text);
              queueTask(() => {
                const r: ItemDataType[] = [];
                for (const item of data) {
                  if (item.key.includes(text)) {
                    r.push(item);
                  }
                }
                listRef.current?.manualRefresh([
                  {
                    type: 'clear',
                  },
                  {
                    type: 'add',
                    data: r,
                    enableSort: true,
                  },
                ]);
              });
            }}
          />
          <EqualHeightList
            parentName="ConversationList"
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
                const convId = 'aaa';
                const v = convId + count++;
                listRef.current?.manualRefresh([
                  {
                    type: 'add',
                    data: [
                      standardizedData({
                        convId: v,
                        convContent: v,
                        key: v,
                      } as ItemDataType),
                    ],
                    enableSort: true,
                  },
                ]);
              }
            }}
          />
        </React.Fragment>
      )}
      <FragmentContainer>
        <InvisiblePlaceholder data={data} />
      </FragmentContainer>
    </SafeAreaView>
  );
}
const styles = createStyleSheet({
  item: {
    // flex: 1,
    // backgroundColor: '#f9c2ff',
    padding: 20,
    marginVertical: 0,
    marginHorizontal: 0,
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemText: {
    marginLeft: 10,
  },
});
