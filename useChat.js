import { useEffect, useState } from 'react';
import { TencentImSDKPlugin, LogLevelEnum } from 'react-native-tim-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import * as ImagePicker from 'react-native-image-picker'; // Import Image Picker
import genTestUserSig from './generateUserSig';
import { Alert } from 'react-native';

const SDKAppID = 20011061;

const generateUserID = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const useChat = () => {
    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [userID, setUserID] = useState('');
    const [receiverID, setReceiverID] = useState('');
    const [userSig, setUserSig] = useState('');

    useEffect(() => {
        const initApp = async () => {
            let storedUserID = await AsyncStorage.getItem('userID');
            if (!storedUserID) {
                storedUserID = generateUserID();
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
        Alert.alert(
            'Start a Chat',
            `To start a chat, enter the receiver’s UserID below.\nShare your UserID (${userID}) with the other user.`,
            [{ text: 'OK' }]
        );
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

    return {
        messages,
        messageText,
        setMessageText,
        receiverID,
        setReceiverID,
        sendMessage,
        sendImage,
        sendVideo,
        userID
    };
};