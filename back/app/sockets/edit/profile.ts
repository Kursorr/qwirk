'use strict'

import * as indicative from 'indicative'
import { RateLimiter } from 'limiter'
import * as fs from 'fs'

import { User } from '../../models/User'
import { Socket } from '../../../scripts/class/Socket'
import { Password } from '../../../scripts/class/Hash'
import { userRules } from '../../../config/config'
import { decodeBase64Image, imgPath } from '../../../scripts/Helper'

const limiter = new RateLimiter(5, 'hour', true)

const profile = (instance: Socket, socket: any) => {
	socket.on('profile', async data => {
		const { DB } = instance
		const user = new User(DB)

		const isValid = await indicative.validate(data, userRules)
			.then(() => true)
			.catch(err => {
				socket.emit('profile', {
					success: false,
					message: `${err[0].field} obligatoire`
				})
				return false
			})

		if (!isValid) return

		const { pseudo, tag, email, password, newPassword } = data

		const emailCursor = await user.filter({ tag })
		const result = await emailCursor.toArray()
		const userID = result[0].id

		const verifPassword = await Password.compare(password, result[0].password)

		if (!verifPassword) {
			socket.emit('profile', {
				success: false,
				message: 'Mot de passe invalide'
			})
			return false
		}

		return limiter.removeTokens(1, async (err, remainingRequests) => {
			if (remainingRequests < 1) {
				return socket.emit('profile', {
					success: false,
					message: 'Vous changez vos informations trop rapidement, veuillez réessayer plus tard.'
				})
			}

			// Short-circuit Operators
			const preparedUser: any = {}
			pseudo && (preparedUser.pseudo = pseudo)
			email && (preparedUser.email = email)
			password && newPassword && (preparedUser.password = await Password.hash(newPassword))

			let imgBuffer;
			if (data && data.avatar) {
				imgBuffer = data.avatar ? decodeBase64Image(data.avatar) : ''
				preparedUser.avatar = imgPath(imgBuffer)

				fs.writeFile('/home/ravaniss/Development/Qwirk/back/avatars/' + preparedUser.avatar, imgBuffer.data, () => {})
			} else {
				preparedUser.avatar = null
			}

			const result = await user.update(userID, preparedUser, password)

			result && socket.emit('profile', { success: true, avatar: preparedUser.avatar})
		})
	})
}

export { profile }
