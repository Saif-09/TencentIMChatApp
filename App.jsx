import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Text,
  View,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { TencentImSDKPlugin, LogLevelEnum } from 'react-native-tim-js';
import genTestUserSig from './generateUserSig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import * as ImagePicker from 'react-native-image-picker'; // Import Image Picker

const SDKAppID = 20011061;

const generateUserID = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const App = () => {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [userID, setUserID] = useState('');
  const [receiverID, setReceiverID] = useState(''); // Receiver's userID for one-to-one messaging
  const [userSig, setUserSig] = useState('');

  useEffect(() => {
    const initApp = async () => {
      let storedUserID = await AsyncStorage.getItem('userID');
      if (!storedUserID) {
        storedUserID = generateUserID(); // Generate a 6-digit random integer string for the user ID
        await AsyncStorage.setItem('userID', storedUserID);
      }
      setUserID(storedUserID);

      const sig = genTestUserSig(storedUserID).userSig;
      setUserSig(sig);

      logDeviceInfo(storedUserID);

      initSDK(storedUserID, sig);
    };

    initApp();
  }, []);

  const logDeviceInfo = (userID) => {
    const deviceName = DeviceInfo.getDeviceNameSync();
    const systemName = DeviceInfo.getSystemName();
    const systemVersion = DeviceInfo.getSystemVersion();
    console.log(`User ID: ${userID}`);
    console.log(`Device: ${deviceName} - ${systemName} ${systemVersion}`);
    Alert.alert('Device Info', `User ID: ${userID}\nDevice: ${deviceName}`);
  };

  const initSDK = async (userID, userSig) => {
    try {
      await TencentImSDKPlugin.v2TIMManager.initSDK(
        SDKAppID,
        LogLevelEnum.V2TIM_LOG_DEBUG,
        {
          onConnectFailed: (code, error) => console.log('Connect failed', code, error),
          onConnectSuccess: () => console.log('Connect success'),
          onConnecting: () => console.log('Connecting'),
          onKickedOffline: () => console.log('Kicked offline'),
          onSelfInfoUpdated: (info) => console.log('Self info updated', info),
          onUserSigExpired: () => console.log('User signature expired'),
        }
      );
      console.log('SDK initialized');
      tencentLogin(userID, userSig);

      addMessageListener();  // Add message listener after login
    } catch (error) {
      console.error('SDK initialization error:', error);
    }
  };

  const tencentLogin = async (userID, userSig) => {
    const res = await TencentImSDKPlugin.v2TIMManager.login(userID, userSig);
    console.log(res, "Response from Tencent login");
  };

  const addMessageListener = () => {
    TencentImSDKPlugin.v2TIMManager
      .getMessageManager()
      .addAdvancedMsgListener({
        onRecvNewMessage: (message) => {
          console.log('New message received:', JSON.stringify(message));
          handleIncomingMessage(message);
        },
      });
  };

  const handleIncomingMessage = (message) => {
    console.log(message, "message received");
  
    const messageInfo = message;
  
    if (messageInfo) {
      let newMessage = null;
  
      // Handle different types of messages
      if (messageInfo.textElem && messageInfo.textElem.text) {
        newMessage = { text: messageInfo.textElem.text, sender: messageInfo.sender };
      } else if (messageInfo.imageElem && messageInfo.imageElem.imageList) {
        // Prioritize getting the original image, fallback to large or thumbnail
        const originalImage = messageInfo.imageElem.imageList.find(image => image.type === 0);
        const largeImage = messageInfo.imageElem.imageList.find(image => image.type === 2);
        const thumbnailImage = messageInfo.imageElem.imageList.find(image => image.type === 1);
  
        const imageUrl = originalImage?.url || largeImage?.url || thumbnailImage?.url;
  
        if (imageUrl) {
          newMessage = { image: imageUrl, sender: messageInfo.sender };
        }
      } else if (messageInfo.videoElem && messageInfo.videoElem.videoPath) {
        newMessage = { video: messageInfo.videoElem.videoPath, sender: messageInfo.sender };
      }
  
      if (newMessage) {
        setMessages((prevMessages) => [
          ...prevMessages,
          { ...newMessage, sender: newMessage.sender === userID ? 'You' : newMessage.sender },
        ]);
      }
    }
  };

  const sendMessage = async () => {
    if (!receiverID) {
      Alert.alert('Error', 'Please enter a receiver ID.');
      return;
    }

    const createMessage =
      await TencentImSDKPlugin.v2TIMManager
        .getMessageManager()
        .createTextMessage(messageText);

    const id = createMessage.data?.id;

    const res = await TencentImSDKPlugin.v2TIMManager
      .getMessageManager()
      .sendMessage({
        id: id,
        receiver: receiverID,
      });

    if (res.code === 0) {
      setMessages([...messages, { text: messageText, sender: 'You' }]);
      setMessageText('');
    } else {
      console.log('Failed to send message', res);
    }
  };

  const sendImage = async () => {
    const result = await ImagePicker.launchImageLibrary({
      mediaType: 'photo',
    });

    if (result?.assets?.length > 0) {
      const image = result.assets[0];

      const createMessage =
        await TencentImSDKPlugin.v2TIMManager
          .getMessageManager()
          .createImageMessage(image.uri);

      const id = createMessage.data?.id;

      const res = await TencentImSDKPlugin.v2TIMManager
        .getMessageManager()
        .sendMessage({
          id: id,
          receiver: receiverID,
        });

      if (res.code === 0) {
        setMessages([...messages, { image: image.uri, sender: 'You' }]);
      } else {
        console.log('Failed to send image', res);
      }
    }
  };

  const sendVideo = async () => {
    const result = await ImagePicker.launchImageLibrary({
      mediaType: 'video',
    });

    if (result?.assets?.length > 0) {
      const video = result.assets[0];

      const createMessage =
        await TencentImSDKPlugin.v2TIMManager
          .getMessageManager()
          .createVideoMessage(video.uri, video.duration);

      const id = createMessage.data?.id;

      const res = await TencentImSDKPlugin.v2TIMManager
        .getMessageManager()
        .sendMessage({
          id: id,
          receiver: receiverID,
        });

      if (res.code === 0) {
        setMessages([...messages, { video: video.uri, sender: 'You' }]);
      } else {
        console.log('Failed to send video', res);
      }
    }
  };

  const renderMessageItem = ({ item }) => (
    <View style={[styles.messageBubble, item.sender === 'You' ? styles.myMessage : styles.theirMessage]}>
      {item.text && <Text style={styles.messageText}>{item.text}</Text>}
      {item.image && <Image source={{ uri: item.image }} style={styles.media} />}
      {item.video && (
        <View>
          <Text style={styles.messageText}>Video message</Text>
          {/* Display video thumbnail or custom component */}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tencent Chat 📨</Text>
      </View>
      <FlatList
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item, index) => index.toString()}
        style={styles.messageList}
        inverted
      />
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Receiver UserID"
          value={receiverID}
          onChangeText={setReceiverID}
          style={styles.input}
          placeholderTextColor={'black'}
        />
        <TextInput
          placeholder="Type a message..."
          value={messageText}
          onChangeText={setMessageText}
          style={styles.input}
          placeholderTextColor={'black'}
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={sendImage} style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Image</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={sendVideo} style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Video</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
);
};

const styles = StyleSheet.create({
container: {
flex: 1,
backgroundColor: '#f5f5f5',
},
header: {
padding: 16,
backgroundColor: '#bba4db',
alignItems: 'center',
},
headerTitle: {
color: '#ffffff',
fontSize: 18,
fontWeight: 'bold',
},
messageList: {
flex: 1,
padding: 16,
},
inputContainer: {
flexDirection: 'row',
alignItems: 'center',
padding: 8,
borderTopWidth: 1,
borderTopColor: '#eeeeee',
},
input: {
flex: 1,
backgroundColor: '#ffffff',
borderRadius: 20,
paddingHorizontal: 16,
paddingVertical: 8,
marginRight: 8,
borderWidth: 1,
borderColor: '#cccccc',
color: 'black',
},
sendButton: {
backgroundColor: '#bba4db',
paddingVertical: 8,
paddingHorizontal: 16,
borderRadius: 20,
},
sendButtonText: {
color: '#ffffff',
fontWeight: 'bold',
},
messageBubble: {
padding: 10,
borderRadius: 20,
marginBottom: 10,
maxWidth: '80%',
},
myMessage: {
alignSelf: 'flex-end',
backgroundColor: '#bba4db',
},
theirMessage: {
alignSelf: 'flex-start',
backgroundColor: '#eeeeee',
},
messageText: {
color: '#888888',
},
media: {
width: 200,
height: 200,
borderRadius: 10,
marginTop: 10,
},
});

export default App;