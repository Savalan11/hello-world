import React, { Component } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { StyleSheet, View, Platform, KeyboardAvoidingView } from "react-native";
import { GiftedChat, Bubble, InputToolbar } from "react-native-gifted-chat";

// require google firebase
//const firebase = require("firebase");
//require("firebase/firestore");
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

export default class Chat extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userID: "",
      amIConnected: false,
      messages: [],
      user: {
        _id: "",
        name: "",
        avatar: "",
      },
    };

    // Dadabase credentials
    const firebaseConfig = {
  apiKey: "AIzaSyDJ-hWErCo8UUCMlOmKVJkqsKaQNUag29U",
  authDomain: "chatapp-eb9be.firebaseapp.com",
  projectId: "chatapp-eb9be",
  storageBucket: "chatapp-eb9be.appspot.com",
  messagingSenderId: "135364382543",
  appId: "1:135364382543:web:d8e6d70e41d616d2daff3a"
    };

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    this.referenceChatMessagesUser = null;
  }

  // To read the messages in storage
  async getMessages() {
    let messages = "";
    let userID = "";
    try {
      // Asynchronous functions can be paused with await (here, wait for a promise)
      messages = (await AsyncStorage.getItem("messages")) || [];
      userID = (await AsyncStorage.getItem("userID")) || "";
      this.setState({
        // to convert messages string back into an object:
        messages: JSON.parse(messages),
        userID,
      });
    } catch (error) {
      console.log(error.message);
    }
  }

  componentDidMount() {
    // set page title, once page is loded
    this.props.navigation.setOptions({ title: this.props.route.params.username });

    // An app must be online to access Google Firebase, offline users can't be authenticated
    // To find out the user's connection status
    NetInfo.fetch().then((connection) => {
      if (connection.isConnected) {
        this.setState({
          amIConnected: true,
        });
        console.log("online");

        // reference to the firestore messages collection
        this.referenceChatMessages = firebase.firestore().collection("messages");
        this.unsubscribe = this.referenceChatMessages.onSnapshot(this.onCollectionUpdate);

        // Start Authentication
        this.authUnsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
          if (!user) {
            await firebase.auth().signInAnonymously();
          }

          // update user state with current user data
          this.setState({
            userID: user.uid,
            messages: [],
            user: {
              _id: user.uid,
              name: this.props.route.params.username,
              avatar: "https://placeimg.com/140/140/any",
            },
          });

          // listen for update in the collection
          this.unsubscribe = this.referenceChatMessages
            .orderBy("createdAt", "desc")
            .onSnapshot(this.onCollectionUpdate);
        });
      } else {
        this.setState({
          amIConnected: false,
        });
        console.log("offline");

        // to retrieve chat messages from asyncStorage
        this.getMessages();
      }
    });
  }

  // when update occurred, set messages state with current data
  onCollectionUpdate = (querySnapshot) => {
    const messages = [];
    // go through each document
    querySnapshot.forEach((doc) => {
      // get the QueryDocumentSnapshot's data
      let data = doc.data();
      messages.push({
        _id: data._id,
        text: data.text,
        createdAt: data.createdAt.toDate(),
        user: {
          _id: data.user._id,
          name: data.user.name,
          avatar: data.user.avatar,
        },
      });
    });
    this.setState({
      messages,
    });
    this.saveMessages();
  };

  // unsubscriebe from collection updates
  componentWillUnmount() {
    if (this.state.amIConnected == true) {
      this.unsubscribe();
      this.authUnsubscribe();
    }
  }

  // callback function used to add messages to current chat window and save it in firebase messages collection database
  onSend(messages = []) {
    this.setState(
      (previousState) => ({
        messages: GiftedChat.append(previousState.messages, messages),
      }),
      () => {
        this.addMessages();
        this.saveMessages();
      }
    );
  }

  // The next step is to create the function saveMessages
  async saveMessages() {
    // use a try-catch block, just in case the asyncStorage promise gets rejected
    try {
      // to convert messages object into a string:
      await AsyncStorage.setItem("messages", JSON.stringify(this.state.messages));
      await AsyncStorage.setItem("userID", this.state.user._id);
    } catch (error) {
      console.log(error.message);
    }
  }

  //  add messages to the database
  addMessages() {
    const message = this.state.messages[0];

    // add new message to messages collection
    this.referenceChatMessages.add({
      _id: message._id,
      text: message.text,
      createdAt: message.createdAt,
      user: this.state.user,
    });
  }

  // To delete messages in the asyncStirage if needed
  async deleteMessages() {
    try {
      await AsyncStorage.removeItem("messages");
      this.setState({
        messages: [],
      });
    } catch (error) {
      console.log(error.message);
    }
  }

  // function to hide input field when offline
  renderInputToolbar(props) {
    if (this.state.amIConnected == false) {
    } else {
      return <InputToolbar {...props} />;
    }
  }

  // function to render grafic design for message styling
  renderBubble(props) {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: "black",
            borderColor: "white",
            borderWidth: 1,
          },
        }}
      />
    );
  }

  render() {
    const { backgroundColor } = this.props.route.params;
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          backgroundColor: backgroundColor,
        }}
      >
        <View
          style={{
            flex: 1,
          }}
        >
          <GiftedChat
            // isConnected={this.state.isConnected}
            renderInputToolbar={this.renderInputToolbar.bind(this)}
            renderBubble={this.renderBubble.bind(this)}
            messages={this.state.messages}
            onSend={(messages) => this.onSend(messages)}
            user={{
              _id: this.state.userID,
            }}
          />
          {Platform.OS === "android" ? <KeyboardAvoidingView behavior="height" /> : null}
        </View>
      </View>
    );
  }
}

// Styling section start:
const styles = StyleSheet.create({});
