import React from 'react';
import {
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Text,
  View,
  StyleSheet,
  Image,
} from 'react-native';
import { useChat } from './useChat'; 

const App = () => {
  const {
    messages,
    messageText,
    setMessageText,
    receiverID,
    setReceiverID,
    sendMessage,
    sendImage,
    sendVideo,
    userID
  } = useChat();

  const renderMessageItem = ({ item }) => (
    <View style={[styles.messageBubble, item.sender === 'You' ? styles.myMessage : styles.theirMessage]}>
      {item.text && <Text style={styles.messageText}>{item.text}</Text>}
      {item.image && <Image source={{ uri: item.image }} style={styles.media} />}
      {item.video && (
        <View style={styles.videoContainer}>
          <Text style={styles.messageText}>Video message</Text>
          {/* Add video thumbnail or custom component */}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tencent Chat 📨</Text>
        <Text style={styles.userID}>User ID: {userID}</Text>
      </View>
      <FlatList
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item, index) => index.toString()}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
      />
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Receiver UserID"
          value={receiverID}
          onChangeText={setReceiverID}
          style={styles.input}
          placeholderTextColor='#888'
        />
        <TextInput
          placeholder="Type a message..."
          value={messageText}
          onChangeText={setMessageText}
          style={styles.input}
          placeholderTextColor='#888'
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={sendImage} style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Image</Text>
        </TouchableOpacity>
        {/* Uncomment and style as needed
        <TouchableOpacity onPress={sendVideo} style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Video</Text>
        </TouchableOpacity>
        */}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  header: {
    paddingVertical: 16,
    backgroundColor: '#4a90e2',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom:10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  userID: {
    color: '#ffffff',
    fontSize: 14,
  },
  messageList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageListContent: {
    paddingBottom: 16, // Padding at the bottom for input visibility
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  input: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  sendButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
    marginBottom: 10,
    maxWidth: '75%',
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  myMessage: {
    backgroundColor: '#4a90e2',
    alignSelf: 'flex-end',
  },
  theirMessage: {
    backgroundColor: '#253c57',
    alignSelf: 'flex-start',
  },
  messageText: {
    color: 'white',
    fontSize: 16,
  },
  media: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginTop: 10,
    resizeMode: 'cover',
  },
  videoContainer: {
    marginTop: 10,
  },
});

export default App;