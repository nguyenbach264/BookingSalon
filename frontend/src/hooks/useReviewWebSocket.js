import { useEffect, useRef } from "react";
import { WS_REVIEW_URL } from "../config/api.js";

const useReviewWebSocket = ({ onNewReview }) => {
	const onNewReviewRef = useRef(onNewReview);

	useEffect(() => {
		onNewReviewRef.current = onNewReview;
	}, [onNewReview]);

	useEffect(() => {
		console.log(
			"🔄 Connecting to WebSocket: ", WS_REVIEW_URL
		);

		const ws = new WebSocket(WS_REVIEW_URL);
		ws.onopen = () => {
			console.log("✅ WebSocket connected");
		};

		/**
		 * Receive message
		 */
		ws.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);

				console.log("📩 WebSocket message:", data);

				/**
				 * Backend expected:
				 *
				 * {
				 *   "type": "NEW_REVIEW",
				 *   "data": {
				 *      "id": 1,
				 *      "username": "Nguyen Van A",
				 *      "reviewContent": "..."
				 *   }
				 * }
				 */

				if (data.type === "NEW_REVIEW") {
					if (!data.data) {
						console.warn(
							"⚠️ NEW_REVIEW nhưng không có data:",
							data
						);

						return;
					}

					onNewReviewRef.current(data.data);
				}
			} catch (error) {
				console.error(
					"❌ Invalid WebSocket message:",
					error
				);
			}
		};

		/**
		 * WebSocket error
		 */
		ws.onerror = (error) => {
			console.error(
				"❌ WebSocket error:",
				error
			);
		};

		/**
		 * WebSocket disconnected
		 */
		ws.onclose = (event) => {
			console.log(
				"🔌 WebSocket disconnected",
				{
					code: event.code,
					reason: event.reason,
					wasClean: event.wasClean,
				}
			);
		};

		/**
		 * Cleanup khi component unmount
		 */
		return () => {
			console.log(
				"🧹 Closing WebSocket..."
			);

			ws.close();
		};


	}, []);
};

export default useReviewWebSocket;