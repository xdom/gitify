import { List, Map } from 'immutable';
import {
  NOTIFICATIONS,
  MARK_NOTIFICATION,
  MARK_REPO_NOTIFICATION,
} from '../actions';
import NativeNotifications from '../utils/notifications';
import { setBadge, updateTrayIcon } from '../utils/comms';
import moment from 'moment';

export default store => next => action => {
  const settings = store.getState().settings;
  const notificationsAccounts = store.getState().notifications.get('response');

  switch (action.type) {
    case NOTIFICATIONS.SUCCESS:
      const previousNotifications = notificationsAccounts.map(
        accNotifications => {
          return accNotifications.update('notifications', notifications =>
            notifications.map(obj => obj.get('id'))
          );
        }
      );

      const now = moment()

      const newNotifications = action.payload.map(accNotifications => {
        const prevAccNotifications = previousNotifications
          .find(
            obj => obj.get('hostname') === accNotifications.get('hostname'),
            null,
            Map()
          )
          .get('notifications', List());

        return accNotifications.get('notifications').filter(obj => {
          const isInPrevNotifications = notif =>
            prevAccNotifications.contains(notif.get('id'));
          const isUnreadReviewRequest = notif => {
            const reason = notif.get('reason');
            const unread = notif.get('unread');
            const updated = moment(notif.get('updated_at'));
            const timeSinceUpdated = now.diff(updated, 'minutes');
            return reason === 'review_requested' && unread
              && timeSinceUpdated > 0 && timeSinceUpdated % 60 === 0;
          }
          return !isInPrevNotifications(obj) || isUnreadReviewRequest(obj);
        });
      });

      const newNotificationsCount = newNotifications.reduce(
        (memo, acc) => memo + acc.size,
        0
      );
      const allNotificationsCount = action.payload.reduce(
        (memo, acc) => memo + acc.get('notifications', List()).size,
        0
      );

      updateTrayIcon(allNotificationsCount);
      setBadge(allNotificationsCount);
      NativeNotifications.setup(
        newNotifications,
        newNotificationsCount,
        settings
      );
      break;

    case MARK_NOTIFICATION.SUCCESS:
      const prevNotificationsCount = notificationsAccounts.reduce(
        (memo, acc) => memo + acc.get('notifications').size,
        0
      );

      updateTrayIcon(prevNotificationsCount - 1);
      setBadge(prevNotificationsCount - 1);
      break;

    case MARK_REPO_NOTIFICATION.SUCCESS:
      const updatedNotificationsCount = notificationsAccounts
        .map(accNotifications => {
          if (accNotifications.get('hostname') !== action.meta.hostname) {
            return accNotifications;
          }

          return accNotifications.update('notifications', notifications => {
            return notifications.filterNot(
              obj =>
                obj.getIn(['repository', 'full_name']) === action.meta.repoSlug
            );
          });
        })
        .reduce((memo, acc) => memo + acc.get('notifications').size, 0);

      updateTrayIcon(updatedNotificationsCount);
      setBadge(updatedNotificationsCount);
      break;
  }

  return next(action);
};
