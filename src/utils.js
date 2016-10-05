import cookie from 'js-cookie'

export function getGAID() {
	var userId = '';
	var gaUserCookie = cookie.get("_ga");
	if (gaUserCookie !== undefined) {
		var cookieValues = gaUserCookie.split('.');
		if (cookieValues.length > 2) {
			userId = cookieValues[2];
		}
	}
	return userId;
}
