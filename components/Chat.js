import React, { Component } from "react";
import { StyleSheet, View, Platform, KeyboardAvoidingView } from "react-native";
import { GiftedChat, Bubble } from "react-native-gifted-chat";

//require google firebase
//const firebase = require("firebase");
//require("firebase/firestore");
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";


export default class Chat extends Component {
  constructor(props) {
    super(props);
    this.state = {
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

  componentDidMount() {
    // set page title, once page is loded
    this.props.navigation.setOptions({ title: this.props.route.params.username });

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
        // uid: user.uid,
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
  };

  // unsubscriebe from collection updates
  componentWillUnmount() {
    this.unsubscribe();
    this.authUnsubscribe();
  }

  // callback function used to add messages to current chat window and save it in firebase messages collection database
  onSend(messages = []) {
    this.setState(
      (previousState) => ({
        messages: GiftedChat.append(previousState.messages, messages),
      }),
      () => {
        this.addMessages();
      }
    );
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
            renderBubble={this.renderBubble.bind(this)}
            messages={this.state.messages}
            onSend={(messages) => this.onSend(messages)}
            user={this.state.user}
          />
          {Platform.OS === "android" ? <KeyboardAvoidingView behavior="height" /> : null}
        </View>
      </View>
    );
  }
}

// Styling section start:
const styles = StyleSheet.create({});
