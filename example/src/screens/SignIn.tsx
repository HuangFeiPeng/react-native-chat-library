import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {
  autoFocus,
  createStyleSheet,
  getScaleFactor,
  LoadingButton,
  LocalIcon,
  TextInput,
  useChatSdkContext,
  useHeaderContext,
  useToastContext,
} from 'react-native-chat-uikit';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppI18nContext } from '../contexts/AppI18nContext';
import { useStyleSheet } from '../hooks/useStyleSheet';
import type { RootScreenParamsList } from '../routes';

type Props = NativeStackScreenProps<RootScreenParamsList>;

let gid: string = '';
let gps: string = '';

try {
  const env = require('../env');
  gid = env.id;
  gps = env.ps;
} catch (error) {
  console.log('test:error', error);
}

export default function SignInScreen({ navigation }: Props): JSX.Element {
  const sf = getScaleFactor();
  const enableKeyboardAvoid = true;
  const { defaultStatusBarTranslucent: statusBarTranslucent } =
    useHeaderContext();
  const { login } = useAppI18nContext();
  const [id, setId] = React.useState(gid);
  const [password, setPassword] = React.useState(gps);
  const [disabled, setDisabled] = React.useState(true);
  const toast = useToastContext();
  const [buttonState, setButtonState] = React.useState<'loading' | 'stop'>(
    'stop'
  );
  const { client } = useChatSdkContext();

  React.useEffect(() => {
    if (id.length > 0 && password.length > 0) {
      setDisabled(false);
    } else {
      setDisabled(true);
    }
  }, [id, password]);

  const _manualLogin = (state: 'loading' | 'stop') => {
    if (state === 'loading') {
      return;
    }
    setButtonState('loading');
    client
      .login(id, password)
      .then(() => {
        console.log('test:login:success');
        setButtonState('stop');
        navigation.push('Home', { params: undefined });
      })
      .catch((error) => {
        console.log('test:login:fail:', error);
        setButtonState('stop');
        toast.showToast('Login Failed');
      });
  };

  return (
    <SafeAreaView
      mode="padding"
      style={useStyleSheet().safe}
      edges={['right', 'left', 'bottom']}
    >
      <KeyboardAvoidingView
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        enabled={enableKeyboardAvoid}
        behavior={Platform.select({ ios: 'padding', default: 'height' })}
        keyboardVerticalOffset={
          enableKeyboardAvoid && statusBarTranslucent ? sf(80) : 0
        }
        pointerEvents="box-none"
      >
        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
          }}
        >
          <View>
            <View style={styles.space} />
            <View>
              <LocalIcon
                name="login_icon"
                size={sf(250)}
                style={{ borderRadius: 0 }}
              />
            </View>
            <TextInput
              autoFocus={autoFocus()}
              multiline={false}
              placeholder={login.id}
              clearButtonMode="while-editing"
              onChangeText={(text) => setId(text)}
              style={styles.item}
              value={id}
            />
            <View style={{ height: sf(18) }} />
            <TextInput
              autoFocus={autoFocus()}
              multiline={false}
              placeholder={login.pass}
              textContentType="password"
              visible-password={false}
              secureTextEntry
              onChangeText={(text) => setPassword(text)}
              style={styles.item}
              value={password}
            />
            <View style={{ height: sf(18) }} />
            <LoadingButton
              disabled={disabled}
              content={login.button}
              style={styles.button}
              state={buttonState}
              onChangeState={(state) => {
                console.log('test:state:', state);
                _manualLogin(state);
              }}
            />
            <View style={styles.tr}>
              <Text style={styles.tip}>{login.tip}</Text>
              <Text
                style={styles.register}
                onPress={() => {
                  setDisabled(true);
                  navigation.push('SignUp', { params: undefined });
                }}
              >
                {login.register}
              </Text>
            </View>
            <View style={styles.space} />
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = createStyleSheet({
  space: {
    flexGrow: 1,
    flexShrink: 1,
  },
  item: {
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 20,
  },
  button: {
    height: 48,
    borderRadius: 24,
    marginBottom: 31,
  },
  tr: {
    justifyContent: 'center',
    flexDirection: 'row',
  },
  tip: {
    color: 'rgba(153, 153, 153, 1)',
  },
  register: {
    paddingLeft: 10,
    color: 'rgba(17, 78, 255, 1)',
    fontWeight: '600',
  },
});
