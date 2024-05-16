import { NotificationInstance } from 'antd/es/notification/interface';
import { DefaultOptionType } from 'antd/es/select';
import createDowntimeSchedule from 'api/plannedDowntime/createDowntimeSchedule';
import { DeleteSchedulePayloadProps } from 'api/plannedDowntime/deleteDowntimeSchedule';
import {
	DowntimeSchedules,
	Recurrence,
} from 'api/plannedDowntime/getAllDowntimeSchedules';
import updateDowntimeSchedule, {
	DowntimeScheduleUpdatePayload,
	PayloadProps,
} from 'api/plannedDowntime/updateDowntimeSchedule';
import { showErrorNotification } from 'components/ExplorerCard/utils';
import { UseMutateAsyncFunction } from 'react-query';
import { ErrorResponse, SuccessResponse } from 'types/api';

type DateTimeString = string | null | undefined;

export const getDuration = (
	startTime: DateTimeString,
	endTime: DateTimeString,
): string => {
	if (!startTime || !endTime) {
		return 'N/A';
	}

	const start = new Date(startTime);
	const end = new Date(endTime);
	const durationMs = Math.abs(end.getTime() - start.getTime());

	const minutes = Math.floor(durationMs / (1000 * 60));
	const hours = Math.floor(durationMs / (1000 * 60 * 60));

	if (minutes < 60) {
		return `${minutes} min`;
	}
	return `${hours} hours`;
};

export const formatDateTime = (dateTimeString?: string | null): string => {
	if (!dateTimeString) {
		return 'N/A';
	}
	const options: Intl.DateTimeFormatOptions = {
		month: 'short',
		day: '2-digit',
		year: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		hour12: true,
	};
	return new Date(dateTimeString).toLocaleString('en-US', options);
};

export const getAlertOptionsFromIds = (
	alertIds: string[],
	alertOptions: DefaultOptionType[],
): DefaultOptionType[] =>
	alertOptions
		.map((alert) => {
			if (alert.value && alertIds?.includes(alert.value as string)) {
				return alert;
			}
			return undefined;
		})
		.filter((alert) => alert !== undefined) as DefaultOptionType[];

export const recurrenceInfo = (recurrence?: Recurrence | null): string => {
	if (!recurrence) {
		return 'No';
	}

	const { startTime, duration, repeatOn, repeatType, endTime } = recurrence;

	const formattedStartTime = startTime ? formatDateTime(startTime) : '';
	const formattedEndTime = endTime ? `to ${formatDateTime(endTime)}` : '';
	const weeklyRepeatString = repeatOn ? `on ${repeatOn.join(', ')}` : '';
	const durationString = duration ? `- Duration: ${duration}` : '';

	return `Repeats - ${repeatType} ${weeklyRepeatString} from ${formattedStartTime} ${formattedEndTime} ${durationString}`;
};

export const defautlInitialValues: Partial<
	DowntimeSchedules & { editMode: boolean }
> = {
	name: '',
	description: '',
	schedule: {
		timezone: '',
		endTime: '',
		recurrence: null,
		startTime: '',
	},
	alertIds: [],
	createdAt: '',
	createdBy: '',
	editMode: false,
};

type DeleteDowntimeScheduleProps = {
	deleteDowntimeScheduleAsync: UseMutateAsyncFunction<
		DeleteSchedulePayloadProps,
		Error,
		number
	>;
	notifications: NotificationInstance;
	refetchAllSchedules: VoidFunction;
	deleteId?: number;
	hideDeleteDowntimeScheduleModal: () => void;
	clearSearch: () => void;
};

export const deleteDowntimeHandler = ({
	deleteDowntimeScheduleAsync,
	refetchAllSchedules,
	deleteId,
	hideDeleteDowntimeScheduleModal,
	clearSearch,
	notifications,
}: DeleteDowntimeScheduleProps): void => {
	if (!deleteId) {
		const errorMsg = new Error(
			'Unable to delete, please provide correct deleteId',
		);
		showErrorNotification(notifications, errorMsg);
	} else {
		deleteDowntimeScheduleAsync(deleteId, {
			onSuccess: () => {
				hideDeleteDowntimeScheduleModal();
				clearSearch();
				notifications.success({
					message: 'View Deleted Successfully',
				});
				refetchAllSchedules();
			},
			onError: (err) => {
				showErrorNotification(notifications, err);
			},
		});
	}
};

export const createEditDowntimeSchedule = async (
	props: DowntimeScheduleUpdatePayload,
): Promise<SuccessResponse<PayloadProps> | ErrorResponse> => {
	if (props.id && props.id > 0) {
		return updateDowntimeSchedule({ ...props });
	}
	return createDowntimeSchedule({ ...props.data });
};
