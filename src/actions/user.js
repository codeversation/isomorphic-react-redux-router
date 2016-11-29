import { USER } from '../actionTypes';
import { mapActionFactory } from './factories';
import decode from 'jwt-decode';
import { log } from 'utilities';

const actions = mapActionFactory(
	USER,
	{
		load() {},
		save() {},
	},
);

export default
	{
		...actions,
		login({ email, password }) {
			return (dispatch) => fetch('/api/v1/session',
				{
					method: 'POST',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						user: { email, password }
					})
				})
				.then(res => res.json())
				.then(resData => ({ ...decode(resData.token), token: resData.token }))
				.then(user => {
					dispatch(actions.merge(user));
					dispatch(actions.save());
					return user;
				})
			;
		},
		update: ({ email, password, name, token }) =>
			dispatch =>
				fetch('/api/v1/user',
					{
						method: 'PUT',
						headers: {
							'Accept': 'application/json',
							'Content-Type': 'application/json',
							'Authorization': token,
						},
						body: JSON.stringify({ user: { email, password, name } }),
					})
					.then(res => res.json())
					.then(({ user }) => {
						dispatch(actions.merge(user));
						dispatch(actions.save(user));
					})
		,
	}
;
