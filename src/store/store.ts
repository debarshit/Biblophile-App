import {create} from 'zustand';
import {produce} from 'immer';
import {persist, createJSONStorage} from 'zustand/middleware';
import CoffeeData from '../data/CoffeeData';
import BeansData from '../data/BeansData';
import BookData from '../data/BooksData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import instance from '../services/axios';
import requests from '../services/requests';

export const useStore = create(
    persist(
      (set, get) => ({
        user: null,
        isAuthenticated: false,
        CoffeeList: CoffeeData,
        BeanList: BeansData,
        GenreList: [], 
        CartPrice: 0,
        FavoritesList: [],
        CartList: [],
        OrderHistoryList: [],
        login: (userData) => {
          set({ isAuthenticated: true, user: userData })
        },
        logout: (userData) => {
          set({ isAuthenticated: false, user: null })
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
                state.CartList[i].ItemPrice = tempprice.toFixed(2).toString();
                totalprice = totalprice + tempprice;
              }
              state.CartPrice = totalprice.toFixed(2).toString();
            }),
          ),
        updateFavoriteList: (type: string, id: string, book: any) =>
        set(
          produce(state => {
            const bookIndex = state.FavoritesList.findIndex(item => item.id === id);
            if (bookIndex !== -1) {
              // If the book is already in the favorites list, remove it
              state.FavoritesList.splice(bookIndex, 1);
            } else {
              // If the book is not in the favorites list, add it to the beginning of the list
              state.FavoritesList.unshift(book);
            }
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
        addToOrderHistoryListFromCart: () =>
          set(
            produce(state => {
              let temp = state.CartList.reduce(
                (accumulator: number, currentValue: any) =>
                  accumulator + parseFloat(currentValue.ItemPrice),
                0,
              );
              if (state.OrderHistoryList.length > 0) {
                state.OrderHistoryList.unshift({
                  OrderDate:
                    new Date().toDateString() +
                    ' ' +
                    new Date().toLocaleTimeString(),
                  CartList: state.CartList,
                  CartListPrice: temp.toFixed(2).toString(),
                });
              } else {
                state.OrderHistoryList.push({
                  OrderDate:
                    new Date().toDateString() +
                    ' ' +
                    new Date().toLocaleTimeString(),
                  CartList: state.CartList,
                  CartListPrice: temp.toFixed(2).toString(),
                });
              }
              state.CartList = [];
            }),
          ),
      }),
      {
        name: 'coffee-app',
        storage: createJSONStorage(() => AsyncStorage),
      },
    ),
  );