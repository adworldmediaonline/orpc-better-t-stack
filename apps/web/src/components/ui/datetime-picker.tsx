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
	const [date, setDate] = React.useState<Date | undefined>(
		value ? new Date(value) : undefined
	);
	const [time, setTime] = React.useState<string>(
		value ? format(new Date(value), "HH:mm") : ""
	);

	React.useEffect(() => {
		if (value) {
			const dateValue = new Date(value);
			setDate(dateValue);
			setTime(format(dateValue, "HH:mm"));
		}
	}, [value]);

	const handleDateSelect = (selectedDate: Date | undefined) => {
		if (!selectedDate) {
			setDate(undefined);
			setTime("");
			onChange?.("");
			return;
		}

		setDate(selectedDate);

		// If time is already set, combine date and time
		if (time) {
			const [hours, minutes] = time.split(":").map(Number);
			const combinedDate = new Date(selectedDate);
			combinedDate.setHours(hours, minutes);
			// Format as datetime-local string (YYYY-MM-DDTHH:mm)
			const year = combinedDate.getFullYear();
			const month = String(combinedDate.getMonth() + 1).padStart(2, '0');
			const day = String(combinedDate.getDate()).padStart(2, '0');
			const hour = String(combinedDate.getHours()).padStart(2, '0');
			const minute = String(combinedDate.getMinutes()).padStart(2, '0');
			onChange?.(`${year}-${month}-${day}T${hour}:${minute}`);
		} else {
			// Set default time to current time if no time is selected
			const now = new Date();
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			// If selecting today, set time to current time
			// If selecting future date, set time to current time as default
			const combinedDate = new Date(selectedDate);
			combinedDate.setHours(now.getHours(), now.getMinutes());
			setTime(format(combinedDate, "HH:mm"));
			// Format as datetime-local string
			const year = combinedDate.getFullYear();
			const month = String(combinedDate.getMonth() + 1).padStart(2, '0');
			const day = String(combinedDate.getDate()).padStart(2, '0');
			const hour = String(combinedDate.getHours()).padStart(2, '0');
			const minute = String(combinedDate.getMinutes()).padStart(2, '0');
			onChange?.(`${year}-${month}-${day}T${hour}:${minute}`);
		}
	};

	const handleTimeChange = (timeValue: string) => {
		if (!date || !timeValue) {
			setTime(timeValue);
			return;
		}

		const [hours, minutes] = timeValue.split(":").map(Number);
		const combinedDate = new Date(date);
		combinedDate.setHours(hours, minutes);

		// Check if the selected time is in the past for today's date
		const now = new Date();
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		if (date.getTime() === today.getTime() && combinedDate < now) {
			// If selecting today and time is in the past, don't update
			// The min attribute on the input should prevent this, but this is a fallback
			return;
		}

		setTime(timeValue);
		// Format as datetime-local string
		const year = combinedDate.getFullYear();
		const month = String(combinedDate.getMonth() + 1).padStart(2, '0');
		const day = String(combinedDate.getDate()).padStart(2, '0');
		const hour = String(combinedDate.getHours()).padStart(2, '0');
		const minute = String(combinedDate.getMinutes()).padStart(2, '0');
		onChange?.(`${year}-${month}-${day}T${hour}:${minute}`);
	};

	const displayValue = date
		? `${format(date, "PPP")} at ${time || format(date, "p")}`
		: placeholder;

	return (
		<div className="space-y-2">
			<Popover>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						className={cn(
							"w-full justify-start text-left font-normal",
							!date && "text-muted-foreground"
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
							selected={date}
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
									value={time}
									onChange={(e) => handleTimeChange(e.target.value)}
									className="w-24"
									min={date && date.getTime() === new Date().setHours(0, 0, 0, 0)
										? format(new Date(), "HH:mm")
										: undefined}
								/>
							</div>
							{date && (
								<div className="text-xs text-muted-foreground">
									{format(date, "PPP")}
									{date.getTime() === new Date().setHours(0, 0, 0, 0) && (
										<div className="text-blue-600 mt-1">
											Only future times allowed for today
										</div>
									)}
									{date.getTime() > new Date().setHours(0, 0, 0, 0) && (
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
