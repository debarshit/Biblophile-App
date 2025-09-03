import { createNavigationContainerRef, ParamListBase } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<ParamListBase>();

export function navigate<RouteName extends keyof ParamListBase>(
  name: RouteName,
  params?: ParamListBase[RouteName],
) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as string, params);
  } else {
    console.warn('[Navigation] Tried navigating before ready:', name, params);
  }
}