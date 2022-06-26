import React from 'react';
import { View, Text, Button } from 'react-native';

export default class Screen1 extends React.Component {
  render() {
    return (
      <View style={{flex:1, justifyContent: 'center', alignItems: 'center'}}>
        <Text>Hello Screen3!</Text>
        <Button
          title="Go to Screen"
          onPress={() => this.props.navigation.navigate('Screen2')}
        />
      </View>
    )
  }
}