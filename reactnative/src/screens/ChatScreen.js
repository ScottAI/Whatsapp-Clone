import React, { Component } from 'react';
import {
  Keyboard, TextInput, StyleSheet, AsyncStorage
} from 'react-native';
import { Container, Header, Content, Item, Text, Left, Right, Button, Body, Thumbnail, Title, View, Icon } from 'native-base';
import SocketIOClient from 'socket.io-client';
import MessageBubble from '../components/MessageBubble';
import { getAllMessages, updateRecdTime } from '../chatsappapi';


const { EmojiOverlay } = require('react-native-emoji-picker');

let user;


export default class ChatScreen extends Component {
  constructor(props) {
    super(props);
    this.onReceivedPrevMessages = this.onReceivedPrevMessages.bind(this);
//     const messages = [
//     {
//         recd_time: 'February 14, 2018 23:16:30 GMT+11:00',
//         user_mobilenumber: 9283498234,
//         msg_text: 'hello',
//         msg_id: 1,
//         receiver_id: 2,
//         sent_time: 'February 14, 2018 23:16:30 GMT+11:00',
//         sender_id: 1
//     },
//     {
//         recd_time: 'February 14, 2018 23:20:30 GMT+11:00',
//         user_mobilenumber: 9283498234,
//         msg_text: 'how r u',
//         msg_id: 2,
//         receiver_id: 2,
//         sent_time: 'February 14, 2018 23:20:30 GMT+11:00',
//         sender_id: 1
//     },
//     {
//         recd_time: 'February 14, 2018 23:25:40 GMT+11:00',
//         user_mobilenumber: 9888888888,
//         msg_text: 'I am fine.. busy!!',
//         msg_id: 3,
//         receiver_id: 1,
//         sent_time: 'February 14, 2018 23:25:30 GMT+11:00',
//         sender_id: 2
//     }
// ];
    this.state = {
      user,
      user_id: this.props.navigation.state.params.user_id,
      friend: this.props.navigation.state.params.friend,
      showPicker: false,
      messages: [],
      value: '',
      height: 40
    };
    
    this.socket = SocketIOClient('https://app.crawfish92.hasura-app.io/', { transports: ['websocket'] });
    // this.socket.open();
    
    console.log(this.socket);
    this.socket.on('message', this.onReceivedMessage);

    this.joinUser = this.joinUser.bind(this);
    this.onReceivedMessage = this.onReceivedMessage.bind(this);
    this.sendMessage.bind(this);
  }

  componentWillMount() {
      this.onReceivedPrevMessages();
  }

  componentDidMount() {
    this.joinUser();
  }

  componentWillUnmount() {
    this.socket.disconnect();
  }

  onReceivedPrevMessages = async () => {
    const prevMessages = [];

    console.log('friendid');
    const friendid = this.state.friend.user_id;
    console.log(friendid);
    const response = await getAllMessages(this.state.user_id, this.state.friend.user_id);
    //skipping first row 
    for (let i = 1; i < response.result.length; i++) {
      prevMessages.push({
        msg_text: response.result[i][1],
        sent_time: response.result[i][2],
        recd_time: response.result[i][3],
        sender_id: response.result[i][4],
        receiver_id: response.result[i][5],
        user_id: response.result[i][4]
    });
    }
    console.log(prevMessages);
    this.setState({ messages: prevMessages });
  }

  onReceivedMessage = (msg) => {
    console.log(msg);
    const oldMessages = this.state.messages;
  // React will automatically rerender the component when a new message is added.
   this.setState({ messages: oldMessages.concat(msg) });
  }

  joinUser() {
    AsyncStorage.getItem('user')
      .then(req => JSON.parse(req))
      .then(json => { 
        this.state.user = json; 
        console.log(`inside joinuser, state ${JSON.stringify(this.state.user)}`); 
      })
      .catch(error => console.log(error));
      console.log('going to connect');
      
      this.socket.on('connect', () => {
        console.log('in CONNECT');
    //		socket.send('User has connected');
        const userid = '1';
     //   let tp_from_mobile = decodeURIComponent(window.location.search.match(/(\?|&)mobile\=([^&]*)/)[2]);
        this.socket.emit('myConnect', {
          msg: 'User has connected',
          fromuserid: userid
        });
      });

      this.socket.on('disconnect', () => {
        console.log('in DICONNECT');
    //		socket.send('User has connected');
        const userid = '1';
     //   let tp_from_mobile = decodeURIComponent(window.location.search.match(/(\?|&)mobile\=([^&]*)/)[2]);
        this.socket.emit('myDisconnect', {
          msg: 'User has disconnected',
          fromuserid: userid
        });
      });

      updateRecdTime(this.state.user_id, this.state.friend.user_id);
  }

  updateSize = (height) => {
    console.log(height);
    this.setState({
      height
    });
  }
 
  sendMessage(msgValue) {
    console.log(this.state.value);
    console.log('MS=', msgValue, 'from :', this.state.user_id, 'to:', this.state.friend.user_id);
    const now = new Date();
    console.log(now);
    const msg = {
			msg_text: msgValue,
      sent_time: now,
      sender_id: this.state.user_id,
      receiver_id: this.state.friend.user_id,
    };
    this.socket.emit('myMessage', msg);
    
		console.log('emitted my message');
     this.state.messages.push(msg);
  //     recd_time: null,
  //     user_mobilenumber: this.state.user.mobilenumber,
  //     msg_text: msgValue,
  //     // need not pass msgid for db
  //     msg_id: 4,
  //     receiver_id: this.state.friend_id,
  //     sent_time: new Date(),
  //     sender_id: this.state.user_id
  // });

    this.setState({
      messages: this.state.messages,
      value: ''
  });
}

openEmoji() {
  Keyboard.dismiss();
  this.setState({ showPicker: true });
}

handlePick(emoji) {  
  const { value } = this.state;
  this.setState({ value: value + emoji });
  console.log(emoji);
 // this.setState({ value: value + emoji });
}

render() {
    const { messages, user_id, value, height } = this.state;
    const { navigate } = this.props.navigation;
    let lastseentime = this.state.friend.lastseen;
    console.log(lastseentime);
    if (lastseentime !== null) {      
      lastseentime = `lastseen ${new Date(this.state.friend.lastseen).toLocaleDateString("ja-JP")} at ${new Date(this.state.friend.lastseen).toLocaleTimeString().replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, '$1$3')}`;
      console.log(lastseentime);
    }
      // const newStyle = {
    //   flex: 1,s
    //   height
    // };
    
    return (

      <Container style={{ backgroundColor: '#fbebb0' }}>  
        <Header style={{ backgroundColor: '#045e54' }}>
        <Left>   
        <Button
          transparent
          onPress={() => navigate('ImageScreen', { dp: this.state.friend.displaypic })}
        >         
          <Thumbnail source={{ uri: this.state.friend.displaypic }} small />
        </Button>
        </Left>
            <Body>
            <Title onPress={() => navigate('Contact', { friend: this.state.friend })}>{ this.state.friend.displayname }</Title>
            <Text note>{ lastseentime }</Text>
            {/* </Button> */}
          </Body>          
          </Header>
        <Content >
         {/* <ScrollView ref={(ref) => { this.scrollView = ref }} style={styles.messages}>
                    {messages}
         </ScrollView> */}
         
         <View style={{ flex: 1 }}>      
         {/* {this.showMessageBubble()}      */}
         {
           messages.map((message) => 
          <MessageBubble key={message.msg_text} user_id={user_id} message={message} />
         )}
         {/* <MessageBubble key={0} direction='left' text='hello' time='sds' />
         <MessageBubble key={1} direction='left' text='hw r u?' time='sssdf' />
         <MessageBubble key={2} direction='right' text='i am fine ' time='sfsdf' /> */}
         </View>
         </Content> 
         <View style={styles.inputBar}>
         <Button transparent onPress={this.openEmoji.bind(this, value)}>
           <Icon name='flower' active style={{ color: '#045e54' }} />
        </Button>
         <TextInput
        placeholder="Type a message"
        onChangeText={(value) => this.setState({ value })}
        style={{ borderRadius: 10,
              backgroundColor: 'white',
              borderWidth: 1,
              borderColor: 'gray',
              flex: 1, 
                      fontSize: 16,
              paddingHorizontal: 10,
              height }}
        editable
        multiline
        value={value}
        onContentSizeChange={(e) => this.updateSize(e.nativeEvent.contentSize.height)}
        onSubmitEditing={Keyboard.dismiss}
         />
        <Button transparent onPress={this.sendMessage.bind(this, value)}>
           <Icon name='send' active style={{ color: '#045e54' }} />
        </Button>
          
          </View>
         
          <EmojiOverlay
            style={{
              height: 200,
              backgroundColor: '#f4f4f4',
              padding: 5
            }}
            horizontal
            visible={this.state.showPicker}
            onEmojiSelected={this.handlePick.bind(this)}
            onTapOutside={() => this.setState({ showPicker: false })} 
          />     
      </Container>
    );
  }  
}

//TODO: separate these out. This is what happens when you're in a hurry!
const styles = StyleSheet.create({

  //ChatView

  outer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    backgroundColor: 'white'
  },

  messages: {
    flex: 1
  },

  //InputBar

  inputBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    paddingVertical: 3,
  },

  textBox: {
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'gray',
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 10
  },

  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 15,
    marginLeft: 5,
    paddingRight: 15,
    borderRadius: 5,
    backgroundColor: '#66db30'
  },

  
});

