// ONLY CAN MODIFY STYLE AND LANGUAGE, MUST NOT CHANGE LOGIC!

/**
 * Form Component
 *
 * A reusable form component that dynamically renders form fields based on configuration.
 * Supports text, email, date, and select field types with validation and submission handling.
 *
 * @example
 * <Form
 *   name="Contact Form"
 *   fields={[
 *     { name: 'name', type: 'text', required: true },
 *     { name: 'email', type: 'email', required: true },
 *     { name: 'date', type: 'date', required: false },
 *     { name: 'category', type: 'select', required: true, options: ['General', 'Support'] }
 *   ]}
 * />
 */

import { useState } from "react"
import { formService } from "../services/formService"

export const Form = ({ name, fields }) => {
	const [formData, setFormData] = useState({})
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [submitStatus, setSubmitStatus] = useState(null)

	const onChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		})
	}

	const onSubmit = async (e) => {
		e.preventDefault()
		setIsSubmitting(true)
		setSubmitStatus(null)

		try {
			await formService.submit(name, formData)
			setFormData({})
			setSubmitStatus("success")
		} catch (error) {
			console.error("Form submission error:", error)
			setSubmitStatus("error")
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<form
			onSubmit={onSubmit}
			className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow-md"
		>
			<h2 className="text-2xl font-bold text-gray-800 mb-6">{name}</h2>

			{/* Status Messages */}
			{submitStatus === "success" && (
				<div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
					Формата е изпратена успешно!
				</div>
			)}
			{submitStatus === "error" && (
				<div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
					Изпращането неуспешно, моля опитайте отново.
				</div>
			)}

			{fields.map((field) => (
				<div
					key={field.name}
					className="mb-4"
				>
					<label
						htmlFor={field.name}
						className="block text-sm font-medium text-gray-700 mb-2"
					>
						{field.name}
						{field.required && (
							<span className="text-red-500 ml-1">*</span>
						)}
					</label>

					{field.type === "text" && (
						<input
							id={field.name}
							type="text"
							name={field.name}
							value={formData[field.name] || ""}
							onChange={onChange}
							required={field.required}
							className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					)}
					{field.type === "email" && (
						<input
							id={field.name}
							type="email"
							name={field.name}
							value={formData[field.name] || ""}
							onChange={onChange}
							required={field.required}
							className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					)}
					{field.type === "date" && (
						<input
							id={field.name}
							type="date"
							name={field.name}
							value={formData[field.name] || ""}
							onChange={onChange}
							required={field.required}
							className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					)}
					{field.type === "select" && (
						<select
							id={field.name}
							name={field.name}
							value={formData[field.name] || ""}
							onChange={onChange}
							required={field.required}
							className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						>
							<option value="">Моля изберете</option>
							{field.options?.map((option) => (
								<option
									key={option}
									value={option}
								>
									{option}
								</option>
							))}
						</select>
					)}
				</div>
			))}
			<button
				type="submit"
				disabled={isSubmitting}
				className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
			>
				{isSubmitting ? "Изпраща се..." : "Изпрати"}
			</button>
		</form>
	)
}
