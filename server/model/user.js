const { BeanModel } = require("redbean-node/dist/bean-model");
const passwordHash = require("../password-hash");
const { R } = require("redbean-node");
const jwt = require("jsonwebtoken");
const { shake256, SHAKE256_LENGTH } = require("../util-server");

class User extends BeanModel {
    /**
     * Reset user password
     * Fix #1510, as in the context reset-password.js, there is no auto model mapping. Call this static function instead.
     * @param {number} userID ID of user to update
     * @param {string} newPassword Users new password
     * @returns {Promise<void>}
     */
    static async resetPassword(userID, newPassword) {
        await R.exec("UPDATE `user` SET password = ? WHERE id = ? ", [
            passwordHash.generate(newPassword),
            userID
        ]);
    }

    /**
     * Reset this users password
     * @param {string} newPassword Users new password
     * @returns {Promise<void>}
     */
    async resetPassword(newPassword) {
        const hashedPassword = passwordHash.generate(newPassword);

        await R.exec("UPDATE `user` SET password = ? WHERE id = ? ", [
            hashedPassword,
            this.id
        ]);

        this.password = hashedPassword;
    }

    /**
     * Create a new JWT for a user
     * @param {User} user The User to create a JsonWebToken for
     * @param {string} jwtSecret The key used to sign the JsonWebToken
     * @returns {string} the JsonWebToken as a string
     */
    static createJWT(user, jwtSecret) {
        return jwt.sign({
            username: user.username,
            role: user.role || "admin",
            h: shake256(user.password, SHAKE256_LENGTH),
        }, jwtSecret);
    }

    /**
     * 检查用户是否有管理员角色
     * @returns {boolean} 是否是管理员
     */
    isAdmin() {
        return this.role === "admin";
    }

    /**
     * 检查用户是否是普通用户
     * @returns {boolean} 是否是普通用户
     */
    isUser() {
        return this.role === "user";
    }

    /**
     * 创建新用户
     * @param {string} username 用户名
     * @param {string} password 密码
     * @param {string} role 角色，默认为user
     * @returns {Promise<User>} 新创建的用户对象
     */
    static async create(username, password, role = "user") {
        const user = R.dispense("user");
        user.username = username;
        user.password = passwordHash.generate(password);
        user.role = role;
        user.active = 1;
        
        await R.store(user);
        return user;
    }
}

module.exports = User;
