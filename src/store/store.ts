import {create} from 'zustand';
import {produce} from 'immer';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import instance from '../services/axios';
import requests from '../services/requests';

interface StoreState {
  user: string | null;
  isAuthenticated: boolean;
  userDetails: any[];
  GenreList: any[];
  CartPrice: number;
  CartList: any[];
  sessionStartTime: Date | null;
  sessionStartPage: number | null;
  selectedCity: string | null;
  latitude: number | null;
  longitude: number | null;
  notifications: {
    inAppPermissionAsked: boolean;
    inAppPermissionGranted: boolean;
    devicePermissionAsked: boolean;
    lastPermissionRequest: string | null;
    expoPushToken: string | null;
  };
  
  login: (userData: any) => Promise<void>;
  logout: () => void;
  updateProfile: (name: string, email: string, phone: string, address: string) => void;
  startSession: () => void;
  setStartPage: (page: number) => void;
  clearSession: () => void;
  fetchGenres: () => Promise<void>;
  addToCart: (cartItem: any) => void;
  calculateCartPrice: () => void;
  incrementCartItemQuantity: (id: string, size: string) => void;
  decrementCartItemQuantity: (id: string, size: string) => void;
  clearCart: () => void;
  setSelectedCity: (city: string) => void;
  getSelectedCity: () => string | null;
  setCoordinates: (lat: number, lng: number) => void;
  setInAppPermissionAsked: (asked: boolean) => void;
  setInAppPermissionGranted: (granted: boolean) => void;
  setDevicePermissionAsked: (asked: boolean) => void;
  setLastPermissionRequest: (timestamp: string) => void;
  setExpoPushToken: (token: string) => void;
  resetNotificationPermissions: () => void;
}

export const useStore = create<StoreState>()(
    persist(
      (set, get) => ({
        user: null,
        isAuthenticated: false,
        userDetails: [],
        GenreList: [], 
        CartPrice: 0,
        CartList: [],
        sessionStartTime: null,
        sessionStartPage: 0,
        selectedCity: null,
        latitude: null,
        longitude: null,
        notifications: {
          inAppPermissionAsked: false,
          inAppPermissionGranted: false,
          devicePermissionAsked: false,
          lastPermissionRequest: null,
          expoPushToken: null,
        },
        
        login: async (userData) => {
          await set(state => ({
            userDetails: [...state.userDetails, userData],
          }));
          set({ isAuthenticated: true, user: userData['userId'] });
        },
        logout: async () => {
          const { userDetails } = get();
          const user = userDetails[0];
          const refreshToken = user?.refreshToken;
          const notificationToken = user?.notificationToken;

          if (refreshToken && notificationToken) {
            try {
                const logoutResponse = await instance.post(requests.userLogout, {
                    refreshToken,
                    notificationToken,
                });
    
                if (logoutResponse.data.message === "Logged out successfully.") {
                    console.log('Logged out from backend successfully');
                } else {
                    console.error('Failed to log out from backend');
                }
            } catch (error) {
                console.error('Error during backend logout:', error);
            }
          }

          set({ 
            isAuthenticated: false, 
            user: null, 
            userDetails: [],
            GenreList: [],
            CartPrice: 0,
            CartList: [],
            sessionStartTime: null,
            sessionStartPage: null,
            selectedCity: null,
            notifications: {
              inAppPermissionAsked: false,
              inAppPermissionGranted: false,
              devicePermissionAsked: false,
              lastPermissionRequest: null,
              expoPushToken: null,
            }
          })
        },
        updateProfile: (field, value) => {
          set(
            produce((state) => {
                if (state.userDetails[0]) {
                    // Map field names to userDetails properties
                    const fieldMap = {
                        'name': 'userName',
                        'userName': 'userUniqueUserName',
                        'email': 'userEmail',
                        'phone': 'userPhone',
                        'address': 'userAddress'
                    };
                    
                    const userDetailField = fieldMap[field] || field;
                    // Only update the specific field, preserving all other data including tokens
                    state.userDetails[0] = {
                        ...state.userDetails[0],
                        [userDetailField]: value
                    };
                }
            })
          );
        },
        startSession: () => {
          const startTime = new Date();
          set({ sessionStartTime: startTime });
        },
        setStartPage: (page) => {
          set({ sessionStartPage: page });
        },
        clearSession: () => {
          set({ sessionStartTime: null });
          set({ sessionStartPage: null });
        },
        fetchGenres: async () => {
          try {
            const response = await instance(requests.getBookGenre);
            const data = response.data.data;
            set({ GenreList: data });
          } catch (error) {
            console.error('Error fetching genres:', error);
          }
        },
        addToCart: (cartItem: any) =>
          set(
            produce(state => {
              let found = false;
              for (let i = 0; i < state.CartList.length; i++) {
                if (state.CartList[i].id == cartItem.id) {
                  found = true;
                  let size = false;
                  for (let j = 0; j < state.CartList[i].prices.length; j++) {
                    if (
                      state.CartList[i].prices[j].size == cartItem.prices[0].size
                    ) {
                      size = true;
                      state.CartList[i].prices[j].quantity++;
                      break;
                    }
                  }
                  if (size == false) {
                    state.CartList[i].prices.push(cartItem.prices[0]);
                  }
                  state.CartList[i].prices.sort((a: any, b: any) => {
                    if (a.size > b.size) {
                      return -1;
                    }
                    if (a.size < b.size) {
                      return 1;
                    }
                    return 0;
                  });
                  break;
                }
              }
              if (found == false) {
                state.CartList.push(cartItem);
              }
            }),
          ),
        calculateCartPrice: () =>
          set(
            produce(state => {
              let totalprice = 0;
              for (let i = 0; i < state.CartList.length; i++) {
                let tempprice = 0;
                for (let j = 0; j < state.CartList[i].prices.length; j++) {
                  tempprice =
                    tempprice +
                    parseFloat(state.CartList[i].prices[j].price) *
                      state.CartList[i].prices[j].quantity;
                }
                state.CartList[i].ItemPrice = tempprice.toFixed(2);
                totalprice = totalprice + tempprice;
              }
              state.CartPrice = totalprice.toFixed(2);
            }),
          ),
          incrementCartItemQuantity: (id: string, size: string) =>
          set(
            produce(state => {
              for (let i = 0; i < state.CartList.length; i++) {
                if (state.CartList[i].id == id) {
                  for (let j = 0; j < state.CartList[i].prices.length; j++) {
                    if (state.CartList[i].prices[j].size == size) {
                      state.CartList[i].prices[j].quantity++;
                      break;
                    }
                  }
                }
              }
            }),
          ),
        decrementCartItemQuantity: (id: string, size: string) =>
          set(
            produce(state => {
              for (let i = 0; i < state.CartList.length; i++) {
                if (state.CartList[i].id == id) {
                  for (let j = 0; j < state.CartList[i].prices.length; j++) {
                    if (state.CartList[i].prices[j].size == size) {
                      if (state.CartList[i].prices.length > 1) {
                        if (state.CartList[i].prices[j].quantity > 1) {
                          state.CartList[i].prices[j].quantity--;
                        } else {
                          state.CartList[i].prices.splice(j, 1);
                        }
                      } else {
                        if (state.CartList[i].prices[j].quantity > 1) {
                          state.CartList[i].prices[j].quantity--;
                        } else {
                          state.CartList.splice(i, 1);
                        }
                      }
                      break;
                    }
                  }
                }
              }
            }),
          ),
        clearCart: () =>
          set(
            produce(state => {
              state.CartList = [];
            }),
          ),
          setSelectedCity: (city: string) => {
            set({ selectedCity: city });
          },
          getSelectedCity: () => get().selectedCity,
          setCoordinates: (lat: number, lng: number) => {
            set({ latitude: lat, longitude: lng });
          },
          setInAppPermissionAsked: (asked: boolean) => {
            set(produce(state => {
              state.notifications.inAppPermissionAsked = asked;
            }));
          },
          setInAppPermissionGranted: (granted: boolean) => {
            set(produce(state => {
              state.notifications.inAppPermissionGranted = granted;
            }));
          },
          setDevicePermissionAsked: (asked: boolean) => {
            set(produce(state => {
              state.notifications.devicePermissionAsked = asked;
            }));
          },
          setLastPermissionRequest: (timestamp: string) => {
            set(produce(state => {
              state.notifications.lastPermissionRequest = timestamp;
            }));
          },
          setExpoPushToken: (token: string) => {
            set(produce(state => {
              state.notifications.expoPushToken = token;
            }));
          },
          resetNotificationPermissions: () => {
            set(produce(state => {
              state.notifications = {
                inAppPermissionAsked: false,
                inAppPermissionGranted: false,
                devicePermissionAsked: false,
                lastPermissionRequest: null,
                expoPushToken: null,
              };
            }));
          },
      }),
      {
        name: 'coffee-app',
        storage: createJSONStorage(() => AsyncStorage),
      },
    ),
  );