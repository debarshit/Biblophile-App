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
        login: async (userData) => {
          await set(state => ({
            userDetails: [...state.userDetails, userData],
          }));
          set({ isAuthenticated: true, user: userData['userId'] });
        },
        logout: () => {
          set({ 
            isAuthenticated: false, 
            user: null, 
            userDetails: [],
            GenreList: [],
            CartPrice: 0,
            CartList: [],
            sessionStartTime: null,
            sessionStartPage: null,
            selectedCity: null
          })
        },
        updateProfile: (name, email, phone, address) => {
          set(
            produce((state) => {
                state.userDetails[0].userName = name;
                state.userDetails[0].userEmail = email;
                state.userDetails[0].userPhone = phone;
                state.userDetails[0].userAddress = address;
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
            const data = response.data;
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
      }),
      {
        name: 'coffee-app',
        storage: createJSONStorage(() => AsyncStorage),
      },
    ),
  );