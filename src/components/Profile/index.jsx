import React from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import profile from '../../assets/profile.png'
import ellipse from '../../assets/Ellipse.png'
import ellipseBottom from '../../assets/EllipseBottom.png'
import ellipseTwo from '../../assets/EllipseTwo.png'
import ellipseBottomTwo from '../../assets/EllipseBottomTwo.png'

const Profile = ({ route, navigation}) => {

  const { firstName, lastName, email, password, linkedin, jobRole, preferences } = route.params;

  console.log('firstname', firstName)

  const handleNext = () => {
    navigation.navigate("Login")
  }
  
  const handleEdit = () => {
    navigation.navigate("Edit" , {
      firstName,
      lastName,
      email,
      password,
      linkedin,
      jobRole,
      preferences
    })
  }

  return (
    <View style={styles.container}>
      <Image source={ellipse} style={styles.ellipseTop} />
      <Image source={ellipseTwo} style={styles.ellipseTop} />
      <Image source={profile} alt='Profile' style={styles.profile} />
      <View style={styles.user}>
        <View style={styles.userDetails}>
          <Text style={styles.data}>First Name :</Text>
          <Text style={styles.details}> {firstName}</Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.data}>Last Name :</Text>
          <Text style={styles.details}> {lastName}</Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.data}>E-mail :</Text>
          <Text style={styles.details}> {email}</Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.data}>Password :</Text>
          <Text style={styles.details}> {password}</Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.data}>LinkedIn URL :</Text>
          <Text style={styles.url}> {linkedin}</Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.data}>Role :</Text>
          <Text style={styles.details}> {jobRole}</Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.data}>Preferences : </Text>
          <Text style={styles.details}>
            {preferences && preferences.length > 0 ? preferences.join(', ') : 'None'}
          </Text>
        </View>
        <View style={styles.botton}>
          <TouchableOpacity>
            <Text style={styles.edit} onPress={() => handleEdit()}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.edit} onPress={() => handleNext()}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Image source={ellipseBottom} style={styles.ellipseBottom} />
      <Image source={ellipseBottomTwo} style={styles.ellipseBottomTwo} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    position: 'relative',
  },
  ellipseTop: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  ellipseBottom: {
    position: "absolute",
    bottom: 0,
    right: 0,
  },
  ellipseBottomTwo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%"
  },
  profile: {
    width: 139,
    height: 138,
    borderRadius: 69,
    position: "absolute",
    top: 160,
    right: 135
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'row',
    paddingLeft: 30,
    paddingTop: 20
  },
  details: {
    color: "#666"
  },
  url: {
    color: '#465BF3'
  },
  data: {
    fontWeight: 'bold'
  },
  edit: {
    width: 118,
    height: 31,
    backgroundColor: '#7680DE',
    borderRadius: 10,
    color: 'white',
    display: 'flex',
    textAlign: 'center',
    fontSize: 17,
    marginLeft: 60,
    marginTop: 40,
    paddingTop: 3
  },
  botton: {
    flex: 1,
    flexDirection: 'row',
  },
  user: {
    position: 'relative',
    top: 310,
    left: 0
  }
})
export default Profile