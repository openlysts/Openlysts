import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) {
  return (
    <div style={{
      background: '#eeeae6',
      boxShadow: '-8px -8px 16px rgba(255,250,244,0.78), 8px 8px 18px rgba(160,143,126,0.31)',
      borderRadius: 16,
      padding: '16px 18px',
      display: 'inline-block',
    }}>
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("", className)}
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-3",
          caption: "flex justify-center relative items-center mb-1",
          caption_label: "text-sm font-semibold",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            "h-7 w-7 p-0 flex items-center justify-center rounded-lg transition-all",
            "bg-[#eeeae6] border-none cursor-pointer",
            "shadow-[-3px_-3px_6px_rgba(255,250,244,0.82),_3px_3px_8px_rgba(160,143,126,0.28)]",
            "hover:shadow-[-5px_-5px_10px_rgba(255,250,244,0.88),_5px_5px_12px_rgba(160,143,126,0.34)]",
            "active:shadow-[inset_-2px_-2px_5px_rgba(255,250,244,0.68),_inset_2px_2px_5px_rgba(160,143,126,0.22)]",
            "text-[#6e6e6e]"
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse",
          head_row: "flex",
          head_cell: "w-8 text-center text-[11px] font-600 text-[#9a9a9a] py-1",
          row: "flex w-full mt-1",
          cell: cn(
            "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
            props.mode === "range"
              ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
              : ""
          ),
          day: cn(
            "h-8 w-8 p-0 font-normal text-[13px] rounded-lg flex items-center justify-center cursor-pointer transition-all",
            "text-[#3a3a3a] bg-transparent border-none",
            "hover:bg-[#ebe7e2] hover:shadow-[inset_-2px_-2px_5px_rgba(255,250,244,0.68),_inset_2px_2px_5px_rgba(160,143,126,0.22)]",
            "aria-selected:opacity-100"
          ),
          day_selected: cn(
            "!bg-[#3a3a3a] !text-[#f1f1f0] !font-semibold",
            "!shadow-[-3px_-3px_6px_rgba(255,255,255,0.08),_3px_3px_8px_rgba(0,0,0,0.28)]",
            "hover:!bg-[#3a3a3a] hover:!text-[#f1f1f0]"
          ),
          day_today: "!font-bold !text-[#996CE4]",
          day_outside: "opacity-30",
          day_disabled: "opacity-20 cursor-not-allowed",
          day_range_middle: "aria-selected:bg-[#ebe7e2] aria-selected:text-[#3a3a3a]",
          day_hidden: "invisible",
          ...classNames,
        }}
        components={{
          IconLeft: ({ className: cls, ...p }) => (
            <ChevronLeft className={cn("h-3.5 w-3.5", cls)} {...p} />
          ),
          IconRight: ({ className: cls, ...p }) => (
            <ChevronRight className={cn("h-3.5 w-3.5", cls)} {...p} />
          ),
        }}
        {...props}
      />
    </div>
  );
}
Calendar.displayName = "Calendar"

export { Calendar }