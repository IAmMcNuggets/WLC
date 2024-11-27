import { CometChat } from '@cometchat-pro/chat';

const appID = process.env.REACT_APP_COMETCHAT_APP_ID!;
const region = process.env.REACT_APP_COMETCHAT_REGION!;

const appSetting = new CometChat.AppSettingsBuilder()
  .subscribePresenceForAllUsers()
  .setRegion(region)
  .build();

export const initCometChat = async () => {
  try {
    await CometChat.init(appID, appSetting);
    console.log('CometChat initialization completed successfully');
    return true;
  } catch (error) {
    console.error('CometChat initialization failed:', error);
    return false;
  }
};

export const loginWithCometChat = async (user: { email: string; name: string }) => {
  try {
    // Use email as the UID (must be unique)
    const uid = user.email.replace(/[^a-zA-Z0-9]/g, '_');
    
    // Try to login first
    try {
      const loggedInUser = await CometChat.login(uid, process.env.REACT_APP_COMETCHAT_AUTH_KEY!);
      console.log('Login successful:', loggedInUser);
      return loggedInUser;
    } catch (loginError) {
      // If login fails, create the user and try logging in again
      const newUser = new CometChat.User(uid);
      newUser.setName(user.name);
      
      await CometChat.createUser(newUser, process.env.REACT_APP_COMETCHAT_AUTH_KEY!);
      const loggedInUser = await CometChat.login(uid, process.env.REACT_APP_COMETCHAT_AUTH_KEY!);
      console.log('User created and logged in:', loggedInUser);
      return loggedInUser;
    }
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

export const createEventChatGroup = async (eventId: string, eventName: string) => {
  try {
    const groupId = `event_${eventId}`;
    const group = new CometChat.Group(
      groupId,
      eventName,
      CometChat.GROUP_TYPE.PUBLIC,
      ''
    );

    const createdGroup = await CometChat.createGroup(group);
    console.log('Group created successfully:', createdGroup);
    return createdGroup;
  } catch (error) {
    console.error('Group creation failed:', error);
    throw error;
  }
};

export const joinEventGroup = async (groupId: string) => {
  try {
    const response = await CometChat.joinGroup(groupId, CometChat.GROUP_TYPE.PUBLIC as CometChat.GroupType, '');
    console.log('Group joined successfully:', response);
    return response;
  } catch (error) {
    console.error('Group joining failed:', error);
    throw error;
  }
};
