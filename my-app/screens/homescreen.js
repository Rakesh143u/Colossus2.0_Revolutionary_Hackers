import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as Location from 'expo-location';


const HomeScreen = ({ navigation }) => {
  const [chatVisible, setChatVisible] = useState(false);
  const [chatQuery, setChatQuery] = useState('');

  const handleProfilePress = () => {
    console.log('Profile pressed');
    // Optionally navigate to a Profile screen
  };

  const handleTabPress = (tab) => {
    console.log(`${tab} pressed`);
    // Add navigation or functionality for each tab
  };

  const handleChatBotPress = () => {
    console.log('Chatbot pressed');
    setChatVisible(true);
  };

  const handleSendQuery = () => {
    console.log('Query sent:', chatQuery);
    // Process the query or navigate to a chatbot screen/modal
    setChatQuery('');
    setChatVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#6A00FF', '#8E2DE2']} style={styles.container}>
        {/* Top Navigation Bar */}
        <View style={styles.topNav}>
          <Text style={styles.topNavTitle}>SafeHer</Text>
          <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
            <Icon name="user" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <Text style={styles.welcome}>Welcome to SafeHer</Text>
          <Text style={styles.subText}>Your Safety Dashboard</Text>
          {/* Additional dashboard widgets can go here */}
        </View>

        {/* Floating Chatbot Button */}
        <TouchableOpacity style={styles.chatBotButton} onPress={handleChatBotPress}>
          <Icon name="comment" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Bottom Navigation Bar */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('Home')}>
            <Icon name="home" size={24} color="#fff" />
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>
          {/* Only one Contacts button is kept */}
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Contacts')}>
            <Icon name="phone" size={24} color="#fff" />
            <Text style={styles.navText}>Contacts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('Alerts')}>
            <Icon name="bell" size={24} color="#fff" />
            <Text style={styles.navText}>Alerts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('Settings')}>
            <Icon name="cog" size={24} color="#fff" />
            <Text style={styles.navText}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Chatbot Modal */}
        <Modal
          visible={chatVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setChatVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.chatModal}>
              <View style={styles.chatHeader}>
                <Text style={styles.chatTitle}>Chatbot</Text>
                <TouchableOpacity onPress={() => setChatVisible(false)}>
                  <Icon name="times" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.chatBody}
              >
                <TextInput
                  style={styles.chatInput}
                  placeholder="Type your query..."
                  placeholderTextColor="#666"
                  value={chatQuery}
                  onChangeText={setChatQuery}
                  multiline
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleSendQuery}>
                  <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
              </KeyboardAvoidingView>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  topNavTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  profileButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcome: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  subText: {
    fontSize: 16,
    color: '#eee',
    marginTop: 8,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingVertical: 10,
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  chatBotButton: {
    position: 'absolute',
    bottom: 70,
    right: 20,
    backgroundColor: '#FF4081',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  chatModal: {
    height: '50%', // Occupies half of the screen
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 10,
  },
  chatTitle: {
    fontSize: 20,
    color: '#333',
    fontWeight: 'bold',
  },
  chatBody: {
    flex: 1,
    justifyContent: 'space-between',
    marginTop: 20,
  },
  chatInput: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#333',
  },
  sendButton: {
    backgroundColor: '#6A00FF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 15,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
