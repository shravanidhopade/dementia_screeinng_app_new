import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveData = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    console.error("Error saving data", e);
  }
};

export const getData = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error("Error reading data", e);
    return null;
  }
};

export const saveTestResult = async (result) => {
  try {
    let history = await getData('@test_history');
    if (!history) {
      history = [];
    }
    history.push({ ...result, date: new Date().toISOString() });
    await saveData('@test_history', history);
  } catch (e) {
    console.error("Error saving test result", e);
  }
};
