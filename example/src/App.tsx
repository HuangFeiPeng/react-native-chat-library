import './utils/globals';

import { CameraRoll as MediaLibrary } from '@react-native-camera-roll/camera-roll';
import Clipboard from '@react-native-clipboard/clipboard';
import FirebaseMessage from '@react-native-firebase/messaging';
import {
  DarkTheme as NDarkTheme,
  DefaultTheme as NDefaultTheme,
  NavigationAction,
  NavigationContainer,
  NavigationState,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { registerRootComponent } from 'expo';
import * as React from 'react';
import { Linking, Platform, View } from 'react-native';
import * as Audio from 'react-native-audio-recorder-player';
import { ChatClient } from 'react-native-chat-sdk';
import {
  createStringSetEn2,
  DarkTheme,
  getScaleFactor,
  GlobalContainer,
  LightTheme,
  Loading,
  Services,
  updateScaleFactor,
} from 'react-native-chat-uikit';
import CreateThumbnail from 'react-native-create-thumbnail';
import * as DocumentPicker from 'react-native-document-picker';
import * as FileAccess from 'react-native-file-access';
import * as ImagePicker from 'react-native-image-picker';
import * as Permissions from 'react-native-permissions';
import VideoComponent from 'react-native-video';

import Dev from './__dev__';
import HomeHeaderRight from './components/HomeHeaderRight';
import HomeHeaderTitle from './components/HomeHeaderTitle';
import { AppChatSdkContext } from './contexts/AppImSdkContext';
import { AppStringSet } from './I18n/AppCStringSet.en';
import type { RootParamsList } from './routes';
import Chat from './screens/Chat';
import ContactInfo from './screens/ContactInfo';
import ContactList from './screens/ContactList';
import GroupInfo from './screens/GroupInfo';
import HomeScreen from './screens/Home';
import LoginScreen from './screens/Login';
import Search from './screens/Search';
import { createAppScaleFactor } from './styles/createAppScaleFactor';

if (Platform.OS === 'web') {
  console.error('web platforms are not supported.');
}

const Root = createNativeStackNavigator<RootParamsList>();

const __KEY__ = '__KEY__';
let __TEST__ = true;
let appKey = '';

try {
  const env = require('./env');
  __TEST__ = env.test ?? false;
  appKey = env.appKey;
} catch (e) {
  console.warn('test:', e);
}

console.log('DEV:', __DEV__);
console.log('TEST:', __TEST__);

export default function App() {
  updateScaleFactor(createAppScaleFactor());

  const isLightTheme = LightTheme.scheme === 'light';

  const permission = Services.createPermissionService({
    permissions: Permissions,
    firebaseMessage: FirebaseMessage,
  });

  const storage = Services.createLocalStorageService();

  const [isReady, setIsReady] = React.useState(__DEV__ ? false : true);
  const [initialState, setInitialState] = React.useState();
  const sf = getScaleFactor();

  React.useEffect(() => {
    const restoreState = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();

        if (Platform.OS !== 'web' && initialUrl == null) {
          // Only restore state if there's no deep link and we're not on web
          const savedStateString = await storage.getItem(__KEY__);
          const state = savedStateString
            ? JSON.parse(savedStateString)
            : undefined;

          if (state !== undefined) {
            setInitialState(state);
          }
        }
      } finally {
        setIsReady(true);
      }
    };

    if (!isReady) {
      restoreState();
    }
  }, [isReady, storage]);
  console.log('test:App:isReady:', isReady);

  if (!isReady) {
    return null;
  }

  const formatNavigationState = (
    state: NavigationState | undefined,
    result: string[] & string[][]
  ) => {
    if (state) {
      const ret: string[] & string[][] = [];
      for (const route of state.routes) {
        ret.push(route.name);
        if (route.state) {
          formatNavigationState(
            route.state as NavigationState | undefined,
            ret
          );
        }
      }
      result.push(ret);
    }
  };

  return (
    <React.StrictMode>
      <GlobalContainer
        option={{ appKey: appKey, autoLogin: false }}
        theme={isLightTheme ? LightTheme : DarkTheme}
        localization={createStringSetEn2(new AppStringSet())}
        sdk={
          new AppChatSdkContext({
            client: ChatClient.getInstance(),
            autoLogin: false,
          })
        }
        header={{
          defaultTitleAlign: 'center',
          defaultStatusBarTranslucent: true,
          defaultHeight: sf(44),
          defaultTopInset: sf(44),
        }}
        services={{
          clipboard: Services.createClipboardService({
            clipboard: Clipboard,
          }),
          notification: Services.createNotificationService({
            firebaseMessage: FirebaseMessage,
            permission: permission,
          }),
          media: Services.createMediaService({
            videoModule: VideoComponent,
            videoThumbnail: CreateThumbnail,
            imagePickerModule: ImagePicker,
            documentPickerModule: DocumentPicker,
            mediaLibraryModule: MediaLibrary,
            fsModule: FileAccess,
            audioModule: Audio,
            permission: permission,
          }),
          permission: permission,
          storage: storage,
        }}
      >
        {__TEST__ === true ? (
          Dev()
        ) : (
          <NavigationContainer
            initialState={initialState}
            theme={isLightTheme ? NDefaultTheme : NDarkTheme}
            onStateChange={(state: NavigationState | undefined) => {
              const rr: string[] & string[][] = [];
              formatNavigationState(state, rr);
              console.log(
                'test:onStateChange:',
                JSON.stringify(rr, undefined, '  ')
              );
              // console.log('test:onStateChange:o:', JSON.stringify(state));
              storage.setItem(__KEY__, JSON.stringify(state));
            }}
            onUnhandledAction={(action: NavigationAction) => {
              console.log('test:onUnhandledAction:', action);
            }}
            fallback={
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                }}
              >
                <Loading color="rgba(15, 70, 230, 1)" size={sf(45)} />
              </View>
            }
          >
            <Root.Navigator initialRouteName="SignIn">
              <Root.Screen
                name="Login"
                options={{
                  headerShown: false,
                }}
                component={LoginScreen}
              />
              <Root.Screen
                name="Home"
                options={() => {
                  return {
                    headerBackVisible: true,
                    headerRight: HomeHeaderRight,
                    headerTitle: () => <HomeHeaderTitle name="Chats" />,
                    headerShadowVisible: false,
                    headerBackTitleVisible: false,
                  };
                }}
                component={HomeScreen}
              />
              <Root.Group>
                <Root.Screen
                  name="ContactInfo"
                  options={() => {
                    return {
                      headerTitle: '',
                      headerShadowVisible: false,
                      headerBackTitleVisible: false,
                    };
                  }}
                  component={ContactInfo}
                />
                <Root.Screen
                  name="GroupInfo"
                  options={() => {
                    return {
                      headerTitle: '',
                      headerShadowVisible: false,
                      headerBackTitleVisible: false,
                    };
                  }}
                  component={GroupInfo}
                />
                <Root.Screen
                  name="ContactList"
                  // options={({ route }) => {
                  //   return {
                  //     headerBackVisible: true,
                  //     headerRight: ContactListHeader,
                  //     headerTitle: route.name,
                  //     headerShadowVisible: false,
                  //   };
                  // }}
                  component={ContactList}
                />
                <Root.Screen
                  name="Chat"
                  options={() => {
                    return {
                      headerTitle: '',
                      headerShadowVisible: false,
                      headerBackTitleVisible: false,
                    };
                  }}
                  component={Chat}
                />
                <Root.Screen
                  name="Search"
                  options={() => {
                    return {
                      headerShown: false,
                      presentation: 'fullScreenModal',
                    };
                  }}
                  component={Search}
                />
              </Root.Group>
            </Root.Navigator>
          </NavigationContainer>
        )}
      </GlobalContainer>
    </React.StrictMode>
  );
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
