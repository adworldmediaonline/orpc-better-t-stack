"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

interface DateTimePickerProps {
	value?: string;
	onChange?: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
}

export function DateTimePicker({
	value,
	onChange,
	placeholder = "Pick a date and time",
	disabled = false,
}: DateTimePickerProps) {
	// Parse the datetime-local string directly without Date conversions
	const parseDateTimeLocal = (datetimeString: string) => {
		console.log("🔍 DateTimePicker parseDateTimeLocal - Input:", datetimeString);

		if (!datetimeString) return { date: undefined, time: "" };

		const [datePart, timePart] = datetimeString.split('T');
		if (!datePart || !timePart) return { date: undefined, time: "" };

		const [year, month, day] = datePart.split('-').map(Number);
		const [hours, minutes] = timePart.split(':').map(Number);

		// Create date with exact components - no timezone conversion
		const date = new Date(year, month - 1, day);
		const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

		console.log("🔍 DateTimePicker parseDateTimeLocal - Parsed:", {
			datetimeString,
			datePart, timePart,
			year, month, day, hours, minutes,
			date: date.toString(),
			time
		});

		return { date, time };
	};

	const { date, time } = parseDateTimeLocal(value || "");
	const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date);
	const [selectedTime, setSelectedTime] = React.useState<string>(time);

	// Log component initialization
	console.log("🔍 DateTimePicker INITIALIZATION:", {
		value,
		parsedDate: date?.toString(),
		parsedTime: time,
		selectedDate: selectedDate?.toString(),
		selectedTime
	});

	const handleDateSelect = (selectedDate: Date | undefined) => {
		if (!selectedDate) {
			setSelectedDate(undefined);
			setSelectedTime("");
			onChange?.("");
			return;
		}

		setSelectedDate(selectedDate);

		// If time is already set, combine date and time EXACTLY as selected
		if (selectedTime) {
			const [hours, minutes] = selectedTime.split(":").map(Number);

			// Create datetime-local string with EXACT components - no modifications
			const year = selectedDate.getFullYear();
			const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
			const day = String(selectedDate.getDate()).padStart(2, '0');
			const hour = String(hours).padStart(2, '0');
			const minute = String(minutes).padStart(2, '0');
			const datetimeString = `${year}-${month}-${day}T${hour}:${minute}`;

			console.log("🔍 DateTimePicker SIMPLE - Date selected with existing time:", {
				selectedDate: selectedDate.toString(),
				selectedTime,
				datetimeString,
				year, month, day, hour, minute,
			});

			console.log("🔍 DateTimePicker CALLING onChange with:", datetimeString);
			onChange?.(datetimeString);
		} else {
			// Set default time to current time if no time is selected
			const now = new Date();
			const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
			setSelectedTime(timeString);

			// Create datetime-local string with EXACT components
			const year = selectedDate.getFullYear();
			const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
			const day = String(selectedDate.getDate()).padStart(2, '0');
			const hour = String(now.getHours()).padStart(2, '0');
			const minute = String(now.getMinutes()).padStart(2, '0');
			const datetimeString = `${year}-${month}-${day}T${hour}:${minute}`;

			console.log("🔍 DateTimePicker SIMPLE - Date selected with default time:", {
				selectedDate: selectedDate.toString(),
				now: now.toString(),
				timeString,
				datetimeString,
				year, month, day, hour, minute,
			});

			console.log("🔍 DateTimePicker CALLING onChange with:", datetimeString);
			onChange?.(datetimeString);
		}
	};

	const handleTimeChange = (timeValue: string) => {
		if (!selectedDate || !timeValue) {
			setSelectedTime(timeValue);
			return;
		}

		setSelectedTime(timeValue);

		// Create datetime-local string with EXACT components - no modifications
		const [hours, minutes] = timeValue.split(":").map(Number);
		const year = selectedDate.getFullYear();
		const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
		const day = String(selectedDate.getDate()).padStart(2, '0');
		const hour = String(hours).padStart(2, '0');
		const minute = String(minutes).padStart(2, '0');
		const datetimeString = `${year}-${month}-${day}T${hour}:${minute}`;

		console.log("🔍 DateTimePicker SIMPLE - Time changed:", {
			timeValue,
			datetimeString,
			year, month, day, hour, minute,
		});

		console.log("🔍 DateTimePicker CALLING onChange with:", datetimeString);
		onChange?.(datetimeString);
	};

	const displayValue = selectedDate
		? `${format(selectedDate, "PPP")} at ${selectedTime || format(selectedDate, "p")}`
		: placeholder;

	return (
		<div className="space-y-2">
			<Popover>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						className={cn(
							"w-full justify-start text-left font-normal",
							!selectedDate && "text-muted-foreground"
						)}
						disabled={disabled}
					>
						<CalendarIcon className="mr-2 h-4 w-4" />
						{displayValue}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0" align="start">
					<div className="flex">
						<Calendar
							mode="single"
							selected={selectedDate}
							onSelect={handleDateSelect}
							disabled={(date) => {
								const today = new Date();
								today.setHours(0, 0, 0, 0);
								return date < today;
							}}
							initialFocus
						/>
						<div className="border-l p-3 space-y-2">
							<Label htmlFor="time" className="text-sm font-medium">
								Time
							</Label>
							<div className="flex items-center space-x-2">
								<Clock className="h-4 w-4 text-muted-foreground" />
								<Input
									id="time"
									type="time"
									value={selectedTime}
									onChange={(e) => handleTimeChange(e.target.value)}
									className="w-24"
									min={selectedDate && selectedDate.getTime() === new Date().setHours(0, 0, 0, 0)
										? format(new Date(), "HH:mm")
										: undefined}
								/>
							</div>
							{selectedDate && (
								<div className="text-xs text-muted-foreground">
									{format(selectedDate, "PPP")}
									{selectedDate.getTime() === new Date().setHours(0, 0, 0, 0) && (
										<div className="text-blue-600 mt-1">
											Only future times allowed for today
										</div>
									)}
									{selectedDate.getTime() > new Date().setHours(0, 0, 0, 0) && (
										<div className="text-green-600 mt-1">
											Any time allowed for future dates
										</div>
									)}
								</div>
							)}
						</div>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
}
