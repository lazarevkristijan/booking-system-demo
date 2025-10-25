import axios from "axios"
import i18n from "../i18n/config"

// Set up axios to send language header with every request
axios.interceptors.request.use(
	(config) => {
		config.headers["Accept-Language"] = i18n.language || "mk"
		return config
	},
	(error) => {
		return Promise.reject(error)
	}
)

export default axios
