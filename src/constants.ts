/**
 * iRacing SDK Constants and Enums
 */

export const VERSION = '1.3.5';

export const SIM_STATUS_URL = 'http://127.0.0.1:32034/get_sim_status?object=simStatus';

export const DATAVALIDEVENTNAME = 'Local\\IRSDKDataValidEvent';
export const MEMMAPFILE = 'Local\\IRSDKMemMapFileName';
export const MEMMAPFILESIZE = 1164 * 1024;
export const BROADCASTMSGNAME = 'IRSDK_BROADCASTMSG';

export const VAR_TYPE_MAP = ['c', '?', 'i', 'I', 'f', 'd'];

export const YAML_TRANSLATER: { [key: number]: number } = {
  0x81: 0x20,
  0x8d: 0x20,
  0x8f: 0x20,
  0x90: 0x20,
  0x9d: 0x20,
};

export const YAML_CODE_PAGE = 'cp1252';

// Status Fields
export class StatusField {
  static readonly status_connected = 1;
}

// Engine Warnings
export class EngineWarnings {
  static readonly water_temp_warning = 0x01;
  static readonly fuel_pressure_warning = 0x02;
  static readonly oil_pressure_warning = 0x04;
  static readonly engine_stalled = 0x08;
  static readonly pit_speed_limiter = 0x10;
  static readonly rev_limiter_active = 0x20;
  static readonly oil_temp_warning = 0x40;
}

// Flags
export class Flags {
  // global flags
  static readonly checkered = 0x0001;
  static readonly white = 0x0002;
  static readonly green = 0x0004;
  static readonly yellow = 0x0008;
  static readonly red = 0x0010;
  static readonly blue = 0x0020;
  static readonly debris = 0x0040;
  static readonly crossed = 0x0080;
  static readonly yellow_waving = 0x0100;
  static readonly one_lap_to_green = 0x0200;
  static readonly green_held = 0x0400;
  static readonly ten_to_go = 0x0800;
  static readonly five_to_go = 0x1000;
  static readonly random_waving = 0x2000;
  static readonly caution = 0x4000;
  static readonly caution_waving = 0x8000;

  // drivers black flags
  static readonly black = 0x010000;
  static readonly disqualify = 0x020000;
  static readonly servicible = 0x040000; // car is allowed service (not a flag)
  static readonly furled = 0x080000;
  static readonly repair = 0x100000;

  // start lights
  static readonly start_hidden = 0x10000000;
  static readonly start_ready = 0x20000000;
  static readonly start_set = 0x40000000;
  static readonly start_go = 0x80000000;
}

// Track Location
export class TrkLoc {
  static readonly not_in_world = -1;
  static readonly off_track = 0;
  static readonly in_pit_stall = 1;
  static readonly aproaching_pits = 2;
  static readonly on_track = 3;
}

// Track Surface
export class TrkSurf {
  static readonly not_in_world = -1;
  static readonly undefined = 0;
  static readonly asphalt_1 = 1;
  static readonly asphalt_2 = 2;
  static readonly asphalt_3 = 3;
  static readonly asphalt_4 = 4;
  static readonly concrete_1 = 5;
  static readonly concrete_2 = 6;
  static readonly racing_dirt_1 = 7;
  static readonly racing_dirt_2 = 8;
  static readonly paint_1 = 9;
  static readonly paint_2 = 10;
  static readonly rumble_1 = 11;
  static readonly rumble_2 = 12;
  static readonly rumble_3 = 13;
  static readonly rumble_4 = 14;
  static readonly grass_1 = 15;
  static readonly grass_2 = 16;
  static readonly grass_3 = 17;
  static readonly grass_4 = 18;
  static readonly dirt_1 = 19;
  static readonly dirt_2 = 20;
  static readonly dirt_3 = 21;
  static readonly dirt_4 = 22;
  static readonly sand = 23;
  static readonly gravel_1 = 24;
  static readonly gravel_2 = 25;
  static readonly grasscrete = 26;
  static readonly astroturf = 27;
}

// Session State
export class SessionState {
  static readonly invalid = 0;
  static readonly get_in_car = 1;
  static readonly warmup = 2;
  static readonly parade_laps = 3;
  static readonly racing = 4;
  static readonly checkered = 5;
  static readonly cool_down = 6;
}

// Camera State
export class CameraState {
  static readonly is_session_screen = 0x0001; // the camera tool can only be activated if viewing the session screen (out of car)
  static readonly is_scenic_active = 0x0002; // the scenic camera is active (no focus car)

  // these can be changed with a broadcast message
  static readonly cam_tool_active = 0x0004;
  static readonly ui_hidden = 0x0008;
  static readonly use_auto_shot_selection = 0x0010;
  static readonly use_temporary_edits = 0x0020;
  static readonly use_key_acceleration = 0x0040;
  static readonly use_key10x_acceleration = 0x0080;
  static readonly use_mouse_aim_mode = 0x0100;
}

// Broadcast Message Types
export class BroadcastMsg {
  static readonly cam_switch_pos = 0; // car position, group, camera
  static readonly cam_switch_num = 1; // driver #, group, camera
  static readonly cam_set_state = 2; // CameraState, unused, unused
  static readonly replay_set_play_speed = 3; // speed, slowMotion, unused
  static readonly replay_set_play_position = 4; // RpyPosMode, Frame Number (high, low)
  static readonly replay_search = 5; // RpySrchMode, unused, unused
  static readonly replay_set_state = 6; // RpyStateMode, unused, unused
  static readonly reload_textures = 7; // ReloadTexturesMode, carIdx, unused
  static readonly chat_command = 8; // ChatCommandMode, subCommand, unused
  static readonly pit_command = 9; // PitCommandMode, parameter
  static readonly telem_command = 10; // irsdk_TelemCommandMode, unused, unused
  static readonly ffb_command = 11; // irsdk_FFBCommandMode, value (float, high, low)
  static readonly replay_search_session_time = 12; // sessionNum, sessionTimeMS (high, low)
  static readonly video_capture = 13; // irsdk_VideoCaptureMode, unused, unused
}

// Chat Command Mode
export class ChatCommandMode {
  static readonly macro = 0; // pass in a number from 1-15 representing the chat macro to launch
  static readonly begin_chat = 1; // Open up a new chat window
  static readonly reply = 2; // Reply to last private chat
  static readonly cancel = 3; // Close chat window
}

// Pit Command Mode (only works when the driver is in the car)
export class PitCommandMode {
  static readonly clear = 0; // Clear all pit checkboxes
  static readonly ws = 1; // Clean the winshield, using one tear off
  static readonly fuel = 2; // Add fuel, optionally specify the amount to add in liters or pass '0' to use existing amount
  static readonly lf = 3; // Change the left front tire, optionally specifying the pressure in KPa or pass '0' to use existing pressure
  static readonly rf = 4; // right front
  static readonly lr = 5; // left rear
  static readonly rr = 6; // right rear
  static readonly clear_tires = 7; // Clear tire pit checkboxes
  static readonly fr = 8; // Request a fast repair
  static readonly clear_ws = 9; // Uncheck Clean the winshield checkbox
  static readonly clear_fr = 10; // Uncheck request a fast repair
  static readonly clear_fuel = 11; // Uncheck add fuel
}

// Telemetry Command Mode (can be called anytime, but telemtry only records when driver is in car)
export class TelemCommandMode {
  static readonly stop = 0; // Turn telemetry recording off
  static readonly start = 1; // Turn telemetry recording on
  static readonly restart = 2; // Write current file to disk and start a new one
}

// Replay State Mode
export class RpyStateMode {
  static readonly erase_tape = 0; // clear any data in the replay tape
}

// Reload Textures Mode
export class ReloadTexturesMode {
  static readonly all = 0; // reload all textuers
  static readonly car_idx = 1; // reload only textures for the specific carIdx
}

// Replay Search Mode
export class RpySrchMode {
  static readonly to_start = 0;
  static readonly to_end = 1;
  static readonly prev_session = 2;
  static readonly next_session = 3;
  static readonly prev_lap = 4;
  static readonly next_lap = 5;
  static readonly prev_frame = 6;
  static readonly next_frame = 7;
  static readonly prev_incident = 8;
  static readonly next_incident = 9;
}

// Replay Position Mode
export class RpyPosMode {
  static readonly begin = 0;
  static readonly current = 1;
  static readonly end = 2;
}

// Camera Switch Mode
export class csMode {
  static readonly at_incident = -3;
  static readonly at_leader = -2;
  static readonly at_exciting = -1;
}

// Pit Service Flags
export class PitSvFlags {
  static readonly lf_tire_change = 0x01;
  static readonly rf_tire_change = 0x02;
  static readonly lr_tire_change = 0x04;
  static readonly rr_tire_change = 0x08;
  static readonly fuel_fill = 0x10;
  static readonly windshield_tearoff = 0x20;
  static readonly fast_repair = 0x40;
}

// Pit Service Status
export class PitSvStatus {
  // status
  static readonly none = 0;
  static readonly in_progress = 1;
  static readonly complete = 2;
  // errors
  static readonly too_far_left = 100;
  static readonly too_far_right = 101;
  static readonly too_far_forward = 102;
  static readonly too_far_back = 103;
  static readonly bad_angle = 104;
  static readonly cant_fix_that = 105;
}

// Pace Mode
export class PaceMode {
  static readonly single_file_start = 0;
  static readonly double_file_start = 1;
  static readonly single_file_restart = 2;
  static readonly double_file_restart = 3;
  static readonly not_pacing = 4;
}

// Pace Flags
export class PaceFlags {
  static readonly end_of_line = 0x0001;
  static readonly free_pass = 0x0002;
  static readonly waved_around = 0x0004;
}

// Car Left Right
export class CarLeftRight {
  static readonly off = 0;
  static readonly clear = 1; // no cars around us.
  static readonly car_left = 2; // there is a car to our left.
  static readonly car_right = 3; // there is a car to our right.
  static readonly car_left_right = 4; // there are cars on each side.
  static readonly two_cars_left = 5; // there are two cars to our left.
  static readonly two_cars_right = 6; // there are two cars to our right.
}

// FFB Command Mode (can be called anytime)
export class FFBCommandMode {
  static readonly ffb_command_max_force = 0; // Set the maximum force when mapping steering torque force to direct input units (float in Nm)
}

// Video Capture Mode
export class VideoCaptureMode {
  static readonly trigger_screen_shot = 0; // save a screenshot to disk
  static readonly start_video_capture = 1; // start capturing video
  static readonly end_video_capture = 2; // stop capturing video
  static readonly toggle_video_capture = 3; // toggle video capture on/off
  static readonly show_video_timer = 4; // show video timer in upper left corner of display
  static readonly hide_video_timer = 5; // hide video timer
}

// Track Wetness
export class TrackWetness {
  static readonly unknown = 0;
  static readonly dry = 1;
  static readonly mostly_dry = 2;
  static readonly very_lightly_wet = 3;
  static readonly lightly_wet = 4;
  static readonly moderately_wet = 5;
  static readonly very_wet = 6;
  static readonly extremely_wet = 7;
}

