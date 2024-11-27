import { CometChat } from '@cometchat-pro/chat';

const appID = '2676329732204af2';
const region = 'us';
const authKey = '62261272516097ebf9139acbd43577cd9231c1b8';

export const initCometChat = () => {
  return new Promise((resolve, reject) => {
    if (typeof CometChat === 'undefined') {
      reject(new Error('CometChat is not loaded'));
      return;
    }

    const appSetting = new CometChat.AppSettingsBuilder()
      .subscribePresenceForAllUsers()
      .setRegion(region)
      .build();

    CometChat.init(appID, appSetting)
      .then(() => {
        console.log('CometChat initialization completed successfully');
        resolve(true);
      })
      .catch(error => {
        console.error('CometChat initialization failed:', error);
        reject(error);
      });
  });
};

export const loginWithCometChat = async (user: { email: string; name: string }) => {
  if (typeof CometChat === 'undefined') {
    throw new Error('CometChat is not loaded');
  }

  const uid = user.email.replace(/[^a-zA-Z0-9]/g, '_');
  
  try {
    const loggedInUser = await CometChat.login(uid, authKey);
    console.log('Login successful:', loggedInUser);
    return loggedInUser;
  } catch (loginError) {
    try {
      const newUser = new CometChat.User(uid);
      newUser.setName(user.name);
      
      await CometChat.createUser(newUser, authKey);
      const loggedInUser = await CometChat.login(uid, authKey);
      console.log('User created and logged in:', loggedInUser);
      return loggedInUser;
    } catch (error) {
      console.error('Failed to create and login user:', error);
      throw error;
    }
  }
};

export const createEventGroup = async (eventId: string, eventName: string) => {
  const groupId = `event_${eventId}`;
  const group = new CometChat.Group(
    groupId,
    eventName,
    CometChat.GROUP_TYPE.PUBLIC
  );

  try {
    const createdGroup = await CometChat.createGroup(group);
    console.log('Group created:', createdGroup);
    return createdGroup;
  } catch (error: any) {
    if (error.code === 'ERR_GUID_ALREADY_EXISTS') {
      console.log('Group already exists, joining it');
      const password = "";
      return await CometChat.joinGroup(groupId, CometChat.GROUP_TYPE.PUBLIC as CometChat.GroupType, password);
    } else {
      console.error('Error creating group:', error);
      throw error;
    }
  }
};