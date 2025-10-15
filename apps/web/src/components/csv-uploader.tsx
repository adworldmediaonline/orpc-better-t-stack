"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

interface CsvUploaderProps {
	onFileSelect: (content: string) => void;
	onClear: () => void;
	fileName?: string;
}

export function CsvUploader({ onFileSelect, onClear, fileName }: CsvUploaderProps) {
	const [isDragging, setIsDragging] = useState(false);

	const handleFile = useCallback(
		(file: File) => {
			if (!file.name.endsWith(".csv")) {
				alert("Please upload a CSV file");
				return;
			}

			const reader = new FileReader();
			reader.onload = (e) => {
				const content = e.target?.result as string;
				onFileSelect(content);
			};
			reader.readAsText(file);
		},
		[onFileSelect]
	);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragging(false);

			const file = e.dataTransfer.files[0];
			if (file) {
				handleFile(file);
			}
		},
		[handleFile]
	);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	}, []);

	const handleFileInput = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) {
				handleFile(file);
			}
		},
		[handleFile]
	);

	if (fileName) {
		return (
			<Card>
				<CardContent className="p-6">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<FileText className="h-8 w-8 text-green-600" />
							<div>
								<p className="font-medium">{fileName}</p>
								<p className="text-sm text-muted-foreground">
									CSV file uploaded successfully
								</p>
							</div>
						</div>
						<Button variant="ghost" size="icon" onClick={onClear}>
							<X className="h-4 w-4" />
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardContent
				className={`p-8 border-2 border-dashed transition-colors ${
					isDragging
						? "border-primary bg-primary/5"
						: "border-border hover:border-primary/50"
				}`}
				onDrop={handleDrop}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
			>
				<div className="flex flex-col items-center justify-center gap-4 text-center">
					<Upload
						className={`h-12 w-12 ${isDragging ? "text-primary" : "text-muted-foreground"}`}
					/>
					<div>
						<p className="font-medium">Drop your CSV file here</p>
						<p className="text-sm text-muted-foreground mt-1">
							or click to browse
						</p>
					</div>
					<input
						type="file"
						accept=".csv"
						onChange={handleFileInput}
						className="hidden"
						id="csv-file-input"
					/>
					<Button variant="outline" asChild>
						<label htmlFor="csv-file-input" className="cursor-pointer">
							Select File
						</label>
					</Button>
					<p className="text-xs text-muted-foreground">
						CSV should have columns: email, name (optional)
					</p>
				</div>
			</CardContent>
		</Card>
	);
}

