<template>
    <div class="form-container">
        <div class="form">
            <form @submit.prevent="submit">
                <h1 class="h3 mb-3 fw-normal" />

                <div v-if="!tokenRequired" class="form-floating">
                    <input id="floatingInput" v-model="username" type="text" class="form-control" placeholder="Username" autocomplete="username" required>
                    <label for="floatingInput">{{ $t("Username") }}</label>
                </div>

                <div v-if="!tokenRequired" class="form-floating mt-3">
                    <input id="floatingPassword" v-model="password" type="password" class="form-control" placeholder="Password" autocomplete="current-password" required>
                    <label for="floatingPassword">{{ $t("Password") }}</label>
                </div>

                <div v-if="tokenRequired">
                    <div class="form-floating mt-3">
                        <input id="otp" v-model="token" type="text" maxlength="6" class="form-control" placeholder="123456" autocomplete="one-time-code" required>
                        <label for="otp">{{ $t("Token") }}</label>
                    </div>
                </div>

                <div v-if="!tokenRequired && isRegisterMode" class="form-floating mt-3">
                    <input id="confirmPassword" v-model="confirmPassword" type="password" class="form-control" placeholder="Confirm Password" autocomplete="new-password" required>
                    <label for="confirmPassword">{{ $t("Confirm Password") }}</label>
                </div>

                <div v-if="!isRegisterMode" class="form-check mb-3 mt-3 d-flex justify-content-center pe-4">
                    <div class="form-check">
                        <input id="remember" v-model="$root.remember" type="checkbox" value="remember-me" class="form-check-input">

                        <label class="form-check-label" for="remember">
                            {{ $t("Remember me") }}
                        </label>
                    </div>
                </div>
                <button class="w-100 btn btn-primary" type="submit" :disabled="processing">
                    {{ isRegisterMode ? $t("Register") : $t("Login") }}
                </button>

                <div v-if="res && !res.ok" class="alert alert-danger mt-3" role="alert">
                    {{ $t(res.msg) }}
                </div>
                
                <div class="mt-3 text-center">
                    <a href="#" @click.prevent="toggleMode">{{ isRegisterMode ? $t("Already have an account? Login") : $t("Create a new account") }}</a>
                </div>
            </form>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            processing: false,
            username: "",
            password: "",
            confirmPassword: "",
            token: "",
            res: null,
            tokenRequired: false,
            isRegisterMode: false,
        };
    },

    mounted() {
        document.title += " - Login";
    },

    unmounted() {
        document.title = document.title.replace(" - Login", "");
    },

    methods: {
        /**
         * Submit the user details and attempt to log in
         * @returns {void}
         */
        submit() {
            this.processing = true;

            if (this.isRegisterMode) {
                if (this.password !== this.confirmPassword) {
                    this.res = {
                        ok: false,
                        msg: "Passwords do not match"
                    };
                    this.processing = false;
                    return;
                }

                this.$root.register(this.username, this.password, (res) => {
                    this.processing = false;
                    this.res = res;
                    
                    if (res.ok) {
                        this.isRegisterMode = false;
                        this.confirmPassword = "";
                        this.res = {
                            ok: true,
                            msg: "Register successful, please login"
                        };
                    }
                });
            } else {
                this.$root.login(this.username, this.password, this.token, (res) => {
                    this.processing = false;

                    if (res.tokenRequired) {
                        this.tokenRequired = true;
                    } else {
                        this.res = res;
                    }
                });
            }
        },

        /**
         * Toggle between login and register mode
         * @returns {void}
         */
        toggleMode() {
            this.isRegisterMode = !this.isRegisterMode;
            this.res = null;
            this.confirmPassword = "";
        }
    },
};
</script>

<style lang="scss" scoped>
.form-container {
    display: flex;
    align-items: center;
    padding-top: 40px;
    padding-bottom: 40px;
}

.form-floating {
    > label {
        padding-left: 1.3rem;
    }

    > .form-control {
        padding-left: 1.3rem;
    }
}

.form {
    width: 100%;
    max-width: 330px;
    padding: 15px;
    margin: auto;
    text-align: center;
}
</style>
