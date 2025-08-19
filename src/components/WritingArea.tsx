import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, 
  Download, 
  Upload, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  Sparkles, 
  BookOpen, 
  Target, 
  TrendingUp, 
  Award, 
  CheckCircle, 
  AlertCircle, 
  Star, 
  Lightbulb, 
  MessageSquare, 
  BarChart3, 
  Clock, 
  Zap, 
  Heart, 
  Trophy, 
  Wand2, 
  PenTool, 
  FileText, 
  Settings, 
  RefreshCw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  X,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  Info,
  HelpCircle,
  Calendar,
  Users,
  Globe,
  Mic,
  Camera,
  Image,
  Link,
  Hash,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Code,
  Scissors,
  Clipboard,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  Layout,
  Sidebar,
  Menu,
  MoreHorizontal,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  CornerDownLeft,
  CornerDownRight,
  CornerUpLeft,
  CornerUpRight,
  Move,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  ZoomIn,
  ZoomOut,
  Focus,
  Crosshair,
  Navigation,
  Compass,
  Map,
  MapPin,
  Route,
  Car,
  Truck,
  Bike,
  Plane,
  Train,
  Ship,
  Anchor,
  Flag,
  Home,
  Building,
  School,
  Hospital,
  Store,
  Factory,
  Warehouse,
  Office,
  Hotel,
  Restaurant,
  Cafe,
  ShoppingCart,
  ShoppingBag,
  CreditCard,
  DollarSign,
  Euro,
  Pound,
  Yen,
  Bitcoin,
  Wallet,
  PiggyBank,
  TrendingDown,
  Activity,
  BarChart,
  BarChart2,
  LineChart,
  PieChart,
  Layers,
  Package,
  Box,
  Archive,
  Folder,
  FolderOpen,
  FolderPlus,
  FolderMinus,
  File,
  FilePlus,
  FileMinus,
  FileEdit,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  Database,
  Server,
  Cloud,
  CloudRain,
  CloudSnow,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Thermometer,
  Droplets,
  Wind,
  Umbrella,
  Snowflake,
  Zap as Lightning,
  Flame,
  Leaf,
  Tree,
  Flower,
  Flower2,
  Seedling,
  Apple,
  Cherry,
  Grape,
  Banana,
  Orange,
  Lemon,
  Strawberry,
  Carrot,
  Corn,
  Wheat,
  Coffee,
  Wine,
  Beer,
  Milk,
  Egg,
  Fish,
  Beef,
  Chicken,
  Pizza,
  Cake,
  Cookie,
  IceCream,
  Candy,
  Donut,
  Croissant,
  Sandwich,
  Salad,
  Soup,
  Utensils,
  UtensilsCrossed,
  ChefHat,
  Shirt,
  Glasses,
  Watch,
  Crown,
  Gem,
  Ring,
  Necklace,
  Earrings,
  Bracelet,
  Handbag,
  Backpack,
  Briefcase,
  Luggage,
  Umbrella as UmbrellaIcon,
  Headphones,
  Speaker,
  Radio,
  Tv,
  Monitor,
  Laptop,
  Tablet,
  Smartphone,
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  PhoneOff,
  Voicemail,
  MessageCircle,
  Mail,
  MailOpen,
  Send,
  Inbox,
  Outbox,
  Archive as ArchiveIcon,
  Trash,
  Trash2,
  Delete,
  Edit,
  Edit2,
  Edit3,
  Pen,
  Pencil,
  Eraser,
  Paintbrush,
  Palette,
  Pipette,
  Ruler,
  Scissors as ScissorsIcon,
  Paperclip,
  Pin,
  Pushpin,
  Bookmark,
  Tag,
  Tags,
  Label,
  Sticker,
  Stamp,
  Seal,
  Certificate,
  Diploma,
  Medal,
  Ribbon,
  Gift,
  GiftCard,
  PartyPopper,
  Balloon,
  Cake as CakeIcon,
  Candle,
  Fireworks,
  Confetti,
  Music,
  Music2,
  Music3,
  Music4,
  Disc,
  Disc2,
  Disc3,
  Radio as RadioIcon,
  Podcast,
  Microphone,
  MicrophoneOff,
  Volume,
  Volume1,
  VolumeOff,
  Shuffle,
  Repeat,
  Repeat1,
  SkipBack,
  SkipForward,
  Rewind,
  FastForward,
  PlayCircle,
  PauseCircle,
  StopCircle,
  Square,
  Circle,
  Triangle,
  Hexagon,
  Octagon,
  Pentagon,
  Diamond,
  Heart as HeartIcon,
  Spade,
  Club,
  Clubs,
  Spades,
  Hearts,
  Diamonds,
  Dice1,
  Dice2,
  Dice3,
  Dice4,
  Dice5,
  Dice6,
  Gamepad,
  Gamepad2,
  Joystick,
  Controller,
  Puzzle,
  PuzzlePiece,
  Blocks,
  Lego,
  Toy,
  Teddy,
  Doll,
  Robot,
  Alien,
  Ghost,
  Skull,
  Bone,
  Paw,
  Cat,
  Dog,
  Rabbit,
  Squirrel,
  Hedgehog,
  Bird,
  Fish as FishIcon,
  Turtle,
  Snail,
  Bug,
  Butterfly,
  Bee,
  Ant,
  Spider,
  Worm,
  Feather,
  Egg as EggIcon,
  Footprints,
  Eye as EyeIcon,
  Ear,
  Nose,
  Mouth,
  Tongue,
  Tooth,
  Brain,
  Lungs,
  Kidney,
  Bone as BoneIcon,
  Dna,
  Pill,
  Syringe,
  Stethoscope,
  Thermometer as ThermometerIcon,
  Bandage,
  Crutch,
  Wheelchair,
  Baby,
  Child,
  User,
  UserPlus,
  UserMinus,
  UserCheck,
  UserX,
  Users as UsersIcon,
  UserCircle,
  UserSquare,
  Contact,
  Contacts,
  AddressBook,
  IdCard,
  CreditCard as CreditCardIcon,
  Key,
  Lock,
  Unlock,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Security,
  Fingerprint,
  Scan,
  QrCode,
  Barcode,
  Hash as HashIcon,
  AtSign,
  Percent,
  Plus as PlusIcon,
  Minus as MinusIcon,
  Equal,
  Divide,
  Multiply,
  Calculator,
  Abacus,
  Ruler as RulerIcon,
  Triangle as TriangleIcon,
  Square as SquareIcon,
  Circle as CircleIcon,
  Hexagon as HexagonIcon,
  Octagon as OctagonIcon,
  Pentagon as PentagonIcon,
  Diamond as DiamondIcon,
  Star as StarIcon,
  Sparkle,
  Sparkles as SparklesIcon,
  Zap as ZapIcon,
  Bolt,
  Flash,
  Flashlight,
  Lamp,
  Lightbulb as LightbulbIcon,
  Candle as CandleIcon,
  Fire,
  Flame as FlameIcon,
  Smoke,
  Cloud as CloudIcon,
  CloudRain as CloudRainIcon,
  CloudSnow as CloudSnowIcon,
  CloudLightning,
  CloudDrizzle,
  CloudHail,
  Tornado,
  Hurricane,
  Cyclone,
  Tsunami,
  Earthquake,
  Volcano,
  Mountain,
  Hill,
  Valley,
  Canyon,
  Desert,
  Beach,
  Island,
  Lake,
  River,
  Waterfall,
  Ocean,
  Wave,
  Tide,
  Current,
  Whirlpool,
  Iceberg,
  Glacier,
  Snow,
  Ice,
  Frost,
  Hail,
  Rain,
  Drizzle,
  Mist,
  Fog,
  Haze,
  Smog,
  Dust,
  Sand,
  Pebble,
  Rock,
  Stone,
  Boulder,
  Crystal,
  Mineral,
  Ore,
  Coal,
  Oil,
  Gas,
  Fuel,
  Battery,
  BatteryLow,
  BatteryCharging,
  Power,
  PowerOff,
  Plug,
  Cable,
  Wifi,
  WifiOff,
  Signal,
  SignalHigh,
  SignalMedium,
  SignalLow,
  SignalZero,
  Antenna,
  Satellite,
  Radar,
  Sonar,
  Gps,
  Location,
  MapPin as MapPinIcon,
  Navigation as NavigationIcon,
  Compass as CompassIcon,
  Route as RouteIcon,
  Road,
  Highway,
  Bridge,
  Tunnel,
  Intersection,
  Roundabout,
  TrafficLight,
  StopSign,
  YieldSign,
  SpeedLimit,
  NoEntry,
  OneWay,
  Detour,
  Construction,
  Roadwork,
  Barrier,
  Cone,
  Flag as FlagIcon,
  Checkpoint,
  Finish,
  Start,
  Goal,
  Target as TargetIcon,
  Bullseye,
  Crosshair as CrosshairIcon,
  Focus as FocusIcon,
  Zoom,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Magnify,
  MagnifyingGlass,
  Search as SearchIcon,
  Find,
  Locate,
  Discover,
  Explore,
  Adventure,
  Journey,
  Trip,
  Vacation,
  Holiday,
  Travel,
  Passport,
  Visa,
  Ticket,
  Boarding,
  Departure,
  Arrival,
  Terminal,
  Gate,
  Runway,
  Hangar,
  Airport,
  Station,
  Platform,
  Track,
  Rail,
  Subway,
  Metro,
  Tram,
  Bus,
  BusStop,
  Taxi,
  Uber,
  Ride,
  Driver,
  Passenger,
  Seat,
  Seatbelt,
  Steering,
  Wheel,
  Tire,
  Engine,
  Exhaust,
  Fuel as FuelIcon,
  Speedometer,
  Dashboard,
  Gear,
  Transmission,
  Brake,
  Accelerator,
  Clutch,
  Horn,
  Headlight,
  Taillight,
  Indicator,
  Mirror,
  Windshield,
  Wiper,
  Window,
  Door,
  Handle,
  Lock as LockIcon,
  Key as KeyIcon,
  Remote,
  Alarm,
  Security as SecurityIcon,
  Camera as CameraIcon,
  Video,
  Record,
  Live,
  Stream,
  Broadcast,
  Podcast as PodcastIcon,
  Radio as RadioIcon2,
  Television,
  Screen,
  Display,
  Monitor as MonitorIcon,
  Computer,
  Desktop,
  Laptop as LaptopIcon,
  Tablet as TabletIcon,
  Phone as PhoneIcon,
  Mobile,
  Smartphone as SmartphoneIcon,
  Smartwatch,
  Wearable,
  Fitness,
  Health,
  Medical,
  Doctor,
  Nurse,
  Patient,
  Clinic,
  Hospital as HospitalIcon,
  Pharmacy,
  Medicine,
  Drug,
  Prescription,
  Treatment,
  Therapy,
  Surgery,
  Operation,
  Procedure,
  Diagnosis,
  Symptom,
  Disease,
  Illness,
  Infection,
  Virus,
  Bacteria,
  Germ,
  Microbe,
  Cell,
  Tissue,
  Organ,
  System,
  Body,
  Anatomy,
  Physiology,
  Biology,
  Chemistry,
  Physics,
  Science,
  Research,
  Study,
  Experiment,
  Test,
  Lab,
  Laboratory,
  Equipment,
  Instrument,
  Tool,
  Device,
  Machine,
  Robot as RobotIcon,
  Automation,
  Artificial,
  Intelligence,
  AI,
  Algorithm,
  Code as CodeIcon,
  Programming,
  Software,
  Hardware,
  Firmware,
  Operating,
  System as SystemIcon,
  Application,
  App,
  Program,
  Script,
  Function,
  Variable,
  Constant,
  Array,
  Object,
  Class,
  Method,
  Property,
  Attribute,
  Parameter,
  Argument,
  Return,
  Loop,
  Condition,
  Branch,
  Decision,
  Logic,
  Boolean,
  True,
  False,
  Null,
  Undefined,
  Empty,
  Full,
  Complete,
  Incomplete,
  Partial,
  Total,
  Sum,
  Average,
  Median,
  Mode,
  Range,
  Minimum,
  Maximum,
  Limit,
  Boundary,
  Edge,
  Corner,
  Center,
  Middle,
  Side,
  Top,
  Bottom,
  Left,
  Right,
  Front,
  Back,
  Inside,
  Outside,
  Above,
  Below,
  Over,
  Under,
  Before,
  After,
  First,
  Last,
  Next,
  Previous,
  Forward,
  Backward,
  Up,
  Down,
  North,
  South,
  East,
  West,
  Northeast,
  Northwest,
  Southeast,
  Southwest,
  Horizontal,
  Vertical,
  Diagonal,
  Parallel,
  Perpendicular,
  Intersect,
  Cross,
  Meet,
  Join,
  Connect,
  Link as LinkIcon,
  Chain,
  Bond,
  Tie,
  Bind,
  Attach,
  Detach,
  Separate,
  Divide as DivideIcon,
  Split,
  Merge,
  Combine,
  Unite,
  Group,
  Ungroup,
  Cluster,
  Scatter,
  Spread,
  Gather,
  Collect,
  Assemble,
  Disassemble,
  Build,
  Construct,
  Create,
  Make,
  Produce,
  Generate,
  Develop,
  Design,
  Plan,
  Organize,
  Arrange,
  Sort,
  Order,
  Rank,
  Priority,
  Important,
  Urgent,
  Critical,
  Essential,
  Necessary,
  Required,
  Optional,
  Choice,
  Select,
  Pick,
  Choose,
  Decide,
  Determine,
  Resolve,
  Solve,
  Fix,
  Repair,
  Restore,
  Recover,
  Backup,
  Save as SaveIcon,
  Load,
  Import,
  Export,
  Transfer,
  Move as MoveIcon,
  Copy as CopyIcon,
  Paste,
  Cut,
  Delete as DeleteIcon,
  Remove,
  Clear,
  Clean,
  Wash,
  Rinse,
  Dry,
  Wet,
  Damp,
  Moist,
  Humid,
  Arid,
  Parched,
  Thirsty,
  Hungry,
  Full as FullIcon,
  Empty as EmptyIcon,
  Vacant,
  Occupied,
  Available,
  Unavailable,
  Open,
  Closed,
  Locked,
  Unlocked,
  Secure,
  Insecure,
  Safe,
  Dangerous,
  Risky,
  Hazardous,
  Warning,
  Caution,
  Alert,
  Notice,
  Information,
  Help,
  Support,
  Assistance,
  Service,
  Customer,
  Client,
  User as UserIcon,
  Account,
  Profile,
  Settings as SettingsIcon,
  Preferences,
  Options,
  Configuration,
  Setup,
  Installation,
  Update,
  Upgrade,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Sync,
  Refresh,
  Reload,
  Restart,
  Reset,
  Undo,
  Redo,
  Cancel,
  Confirm,
  Accept,
  Reject,
  Approve,
  Deny,
  Allow,
  Block,
  Ban,
  Permit,
  Grant,
  Revoke,
  Enable,
  Disable,
  Activate,
  Deactivate,
  Turn,
  Switch,
  Toggle,
  Change,
  Modify,
  Adjust,
  Customize,
  Personalize,
  Tailor,
  Adapt,
  Fit,
  Resize,
  Scale,
  Stretch,
  Shrink,
  Expand,
  Collapse,
  Fold,
  Unfold,
  Roll,
  Unroll,
  Wrap,
  Unwrap,
  Pack,
  Unpack,
  Bundle,
  Unbundle,
  Compress,
  Decompress,
  Zip,
  Unzip,
  Archive as ArchiveIcon2,
  Extract,
  Install,
  Uninstall,
  Add,
  Subtract,
  Multiply as MultiplyIcon,
  Divide as DivideIcon2,
  Calculate,
  Compute,
  Process,
  Execute,
  Run,
  Start as StartIcon,
  Stop,
  Pause as PauseIcon,
  Resume,
  Continue,
  Proceed,
  Advance,
  Progress,
  Improve,
  Enhance,
  Optimize,
  Maximize,
  Minimize,
  Reduce,
  Increase,
  Decrease,
  Raise,
  Lower,
  Lift,
  Drop,
  Push,
  Pull,
  Drag,
  Drop as DropIcon,
  Grab,
  Hold,
  Release,
  Let,
  Go,
  Come,
  Stay,
  Leave,
  Enter,
  Exit,
  Return,
  Depart,
  Arrive,
  Reach,
  Approach,
  Retreat,
  Escape,
  Flee,
  Run as RunIcon,
  Walk,
  Jog,
  Sprint,
  Marathon,
  Race,
  Competition,
  Contest,
  Tournament,
  Championship,
  League,
  Team,
  Player,
  Athlete,
  Coach,
  Referee,
  Judge,
  Jury,
  Verdict,
  Decision as DecisionIcon,
  Judgment,
  Opinion,
  View,
  Perspective,
  Angle,
  Point,
  Dot,
  Spot,
  Mark,
  Sign,
  Symbol,
  Icon,
  Image as ImageIcon,
  Picture,
  Photo,
  Snapshot,
  Screenshot,
  Capture,
  Frame,
  Border,
  Outline,
  Shape,
  Form,
  Structure,
  Pattern,
  Design as DesignIcon,
  Style,
  Theme,
  Template,
  Layout as LayoutIcon,
  Format,
  Alignment,
  Spacing,
  Margin,
  Padding,
  Width,
  Height,
  Size,
  Dimension,
  Measurement,
  Unit,
  Scale as ScaleIcon,
  Ratio,
  Proportion,
  Percentage,
  Fraction,
  Decimal,
  Number,
  Digit,
  Figure,
  Amount,
  Quantity,
  Count,
  Total as TotalIcon,
  Sum as SumIcon,
  Difference,
  Product,
  Quotient,
  Remainder,
  Result,
  Outcome,
  Output,
  Input,
  Data,
  Information as InformationIcon,
  Knowledge,
  Wisdom,
  Understanding,
  Comprehension,
  Insight,
  Awareness,
  Consciousness,
  Mind,
  Thought,
  Idea,
  Concept,
  Theory,
  Hypothesis,
  Assumption,
  Belief,
  Faith,
  Trust,
  Confidence,
  Certainty,
  Doubt,
  Question,
  Answer,
  Solution,
  Problem,
  Issue,
  Challenge,
  Difficulty,
  Obstacle,
  Barrier as BarrierIcon,
  Hurdle,
  Block as BlockIcon,
  Wall,
  Fence,
  Gate as GateIcon,
  Door as DoorIcon,
  Window as WindowIcon,
  Opening,
  Entrance,
  Exit as ExitIcon,
  Passage,
  Corridor,
  Hall,
  Room,
  Space,
  Area,
  Zone,
  Region,
  Territory,
  Land,
  Ground,
  Floor,
  Ceiling,
  Roof,
  Wall as WallIcon,
  Foundation,
  Base,
  Support,
  Pillar,
  Column,
  Beam,
  Frame as FrameIcon,
  Structure as StructureIcon,
  Building as BuildingIcon,
  House,
  Home as HomeIcon,
  Apartment,
  Condo,
  Villa,
  Mansion,
  Castle,
  Palace,
  Tower,
  Skyscraper,
  Office as OfficeIcon,
  Store as StoreIcon,
  Shop,
  Market,
  Mall,
  Center,
  Plaza,
  Square as SquareIcon2,
  Park,
  Garden,
  Yard,
  Field,
  Farm,
  Ranch,
  Barn,
  Stable,
  Shed,
  Garage,
  Warehouse as WarehouseIcon,
  Factory as FactoryIcon,
  Plant,
  Mill,
  Mine,
  Quarry,
  Well,
  Pump,
  Tank,
  Container,
  Vessel,
  Bottle,
  Jar,
  Can,
  Box as BoxIcon,
  Package as PackageIcon,
  Parcel,
  Shipment,
  Delivery,
  Mail as MailIcon,
  Post,
  Letter,
  Envelope,
  Stamp as StampIcon,
  Address,
  Zip,
  Code as CodeIcon2,
  Postal,
  Service as ServiceIcon,
  Express,
  Priority,
  Standard,
  Economy,
  First,
  Second,
  Third,
  Fourth,
  Fifth,
  Sixth,
  Seventh,
  Eighth,
  Ninth,
  Tenth,
  Eleventh,
  Twelfth,
  Thirteenth,
  Fourteenth,
  Fifteenth,
  Sixteenth,
  Seventeenth,
  Eighteenth,
  Nineteenth,
  Twentieth,
  Twenty,
  Thirty,
  Forty,
  Fifty,
  Sixty,
  Seventy,
  Eighty,
  Ninety,
  Hundred,
  Thousand,
  Million,
  Billion,
  Trillion,
  Quadrillion,
  Quintillion,
  Sextillion,
  Septillion,
  Octillion,
  Nonillion,
  Decillion,
  Infinity,
  Zero,
  One,
  Two,
  Three,
  Four,
  Five,
  Six,
  Seven,
  Eight,
  Nine,
  Ten,
  Eleven,
  Twelve,
  Thirteen,
  Fourteen,
  Fifteen,
  Sixteen,
  Seventeen,
  Eighteen,
  Nineteen,
  Alpha,
  Beta,
  Gamma,
  Delta,
  Epsilon,
  Zeta,
  Eta,
  Theta,
  Iota,
  Kappa,
  Lambda,
  Mu,
  Nu,
  Xi,
  Omicron,
  Pi,
  Rho,
  Sigma,
  Tau,
  Upsilon,
  Phi,
  Chi,
  Psi,
  Omega
} from 'lucide-react';
import { generatePrompt, getSynonyms, rephraseSentence, evaluateEssay } from '../lib/openai';

interface WritingAreaProps {
  onContentChange?: (content: string) => void;
  initialContent?: string;
  textType?: string;
  prompt?: string;
  onPromptChange?: (prompt: string) => void;
}

export function WritingArea({ 
  onContentChange, 
  initialContent = '', 
  textType = 'narrative',
  prompt: propPrompt,
  onPromptChange 
}: WritingAreaProps) {
  // State management
  const [content, setContent] = useState(initialContent);
  const [prompt, setPrompt] = useState(propPrompt || '');
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const [activeTab, setActiveTab] = useState('text-type-analysis');
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showWordCount, setShowWordCount] = useState(true);
  const [fontSize, setFontSize] = useState(16);
  const [lineHeight, setLineHeight] = useState(1.6);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [showSynonyms, setShowSynonyms] = useState(false);
  const [synonyms, setSynonyms] = useState<string[]>([]);
  const [isLoadingSynonyms, setIsLoadingSynonyms] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [planningNotes, setPlanningNotes] = useState('');
  const [writingGoals, setWritingGoals] = useState('');
  const [timeSpent, setTimeSpent] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [paraphraseInput, setParaphraseInput] = useState('');
  const [paraphraseOutput, setParaphraseOutput] = useState('');
  const [isParaphrasing, setIsParaphrasing] = useState(false);
  const [vocabularyWords, setVocabularyWords] = useState<string[]>([]);
  const [progressData, setProgressData] = useState({
    wordsWritten: 0,
    timeSpent: 0,
    sessionsCompleted: 0,
    averageWordsPerMinute: 0
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load prompt from multiple sources on component mount
  useEffect(() => {
    const loadPrompt = () => {
      console.log('🔍 WritingArea: Loading prompt...');
      
      // Priority order for prompt sources
      const sources = [
        propPrompt,
        localStorage.getItem('generatedPrompt'),
        localStorage.getItem(`${textType}_prompt`),
        localStorage.getItem('customPrompt'),
        localStorage.getItem('selectedPrompt')
      ];
      
      for (const source of sources) {
        if (source && source.trim()) {
          console.log('✅ WritingArea: Prompt loaded from source:', source.substring(0, 50) + '...');
          setPrompt(source);
          if (onPromptChange) {
            onPromptChange(source);
          }
          return;
        }
      }
      
      console.log('⚠️ WritingArea: No prompt found in any source');
    };

    loadPrompt();
  }, [propPrompt, textType, onPromptChange]);

  // Auto-save functionality
  useEffect(() => {
    const autoSave = () => {
      if (content.trim()) {
        setIsAutoSaving(true);
        localStorage.setItem('writingContent', content);
        localStorage.setItem('lastSaved', new Date().toISOString());
        setLastSaved(new Date());
        setTimeout(() => setIsAutoSaving(false), 1000);
      }
    };

    const autoSaveTimer = setTimeout(autoSave, 2000);
    return () => clearTimeout(autoSaveTimer);
  }, [content]);

  // Timer functionality
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning]);

  // Update statistics when content changes
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    const characterCount = content.length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed

    setWordCount(wordCount);
    setCharacterCount(characterCount);
    setReadingTime(readingTime);

    if (onContentChange) {
      onContentChange(content);
    }

    // Update progress data
    setProgressData(prev => ({
      ...prev,
      wordsWritten: wordCount,
      averageWordsPerMinute: timeSpent > 0 ? Math.round((wordCount / timeSpent) * 60) : 0
    }));
  }, [content, onContentChange, timeSpent]);

  // Handle content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    // Start timer when user starts typing
    if (!isTimerRunning && newContent.trim()) {
      setIsTimerRunning(true);
    }
  };

  // Handle text selection for synonyms
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const selectedText = selection.toString().trim();
      if (selectedText.split(' ').length === 1) { // Only single words
        setSelectedText(selectedText);
        setShowSynonyms(true);
        loadSynonyms(selectedText);
      }
    }
  };

  // Load synonyms for selected word
  const loadSynonyms = async (word: string) => {
    setIsLoadingSynonyms(true);
    try {
      const synonymList = await getSynonyms(word);
      setSynonyms(synonymList);
    } catch (error) {
      console.error('Error loading synonyms:', error);
      setSynonyms([]);
    } finally {
      setIsLoadingSynonyms(false);
    }
  };

  // Replace selected text with synonym
  const replaceSynonym = (synonym: string) => {
    if (textareaRef.current && selectedText) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + synonym + content.substring(end);
      setContent(newContent);
      setShowSynonyms(false);
      setSelectedText('');
    }
  };

  // Evaluate writing
  const handleEvaluate = async () => {
    if (!content.trim()) return;
    
    setIsEvaluating(true);
    try {
      const result = await evaluateEssay(content, textType);
      setEvaluation(result);
      setActiveTab('coaching-tips');
    } catch (error) {
      console.error('Error evaluating writing:', error);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Paraphrase text
  const handleParaphrase = async () => {
    if (!paraphraseInput.trim()) return;
    
    setIsParaphrasing(true);
    try {
      const result = await rephraseSentence(paraphraseInput);
      setParaphraseOutput(result);
    } catch (error) {
      console.error('Error paraphrasing:', error);
      setParaphraseOutput('Sorry, there was an error paraphrasing your text. Please try again.');
    } finally {
      setIsParaphrasing(false);
    }
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Text Type Analysis Tab Content
  const renderTextTypeAnalysis = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border-2 border-blue-200">
        <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
          <Target className="h-6 w-6 mr-2" />
          {textType.charAt(0).toUpperCase() + textType.slice(1)} Writing Analysis
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium">Word Count</span>
              <span className="text-2xl font-bold text-blue-600">{wordCount}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((wordCount / 300) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-1">Target: 250-300 words</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium">Reading Time</span>
              <span className="text-2xl font-bold text-green-600">{readingTime} min</span>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-1" />
              Based on 200 words/minute
            </div>
          </div>
        </div>

        <button
          onClick={handleEvaluate}
          disabled={isEvaluating || !content.trim()}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isEvaluating ? (
            <>
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              Analyzing Your Writing...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              Analyze Text Type
            </>
          )}
        </button>
      </div>
    </div>
  );

  // Vocabulary Sophistication Tab Content
  const renderVocabularySophistication = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-xl border-2 border-green-200">
        <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center">
          <BookOpen className="h-6 w-6 mr-2" />
          Vocabulary Enhancement
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter text to paraphrase:
            </label>
            <textarea
              value={paraphraseInput}
              onChange={(e) => setParaphraseInput(e.target.value)}
              placeholder="Type or paste text you want to improve..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>
          
          <button
            onClick={handleParaphrase}
            disabled={isParaphrasing || !paraphraseInput.trim()}
            className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isParaphrasing ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Enhancing...
              </>
            ) : (
              <>
                <Wand2 className="h-5 w-5 mr-2" />
                Paraphrase
              </>
            )}
          </button>
          
          {paraphraseOutput && (
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-700">Enhanced Version:</span>
                <button
                  onClick={() => copyToClipboard(paraphraseOutput)}
                  className="text-green-600 hover:text-green-700"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <p className="text-gray-800">{paraphraseOutput}</p>
            </div>
          )}
        </div>
      </div>

      {/* Synonym Helper */}
      {showSynonyms && (
        <div className="bg-white p-4 rounded-lg border-2 border-yellow-200 shadow-lg">
          <h4 className="font-semibold text-gray-800 mb-3">
            Synonyms for "{selectedText}":
          </h4>
          {isLoadingSynonyms ? (
            <div className="flex items-center text-gray-500">
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Loading synonyms...
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {synonyms.map((synonym, index) => (
                <button
                  key={index}
                  onClick={() => replaceSynonym(synonym)}
                  className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm hover:bg-yellow-200 transition-colors"
                >
                  {synonym}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowSynonyms(false)}
            className="mt-3 text-gray-500 hover:text-gray-700 text-sm"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );

  // Progress Tracking Tab Content
  const renderProgressTracking = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-200">
        <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center">
          <TrendingUp className="h-6 w-6 mr-2" />
          Writing Progress
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium">Time Spent</span>
              <div className="flex items-center">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`p-2 rounded-full mr-2 ${isTimerRunning ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
                >
                  {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <span className="text-2xl font-bold text-purple-600">{formatTime(timeSpent)}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium">Words/Minute</span>
              <span className="text-2xl font-bold text-pink-600">{progressData.averageWordsPerMinute}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-3">Writing Goals</h4>
          <textarea
            value={writingGoals}
            onChange={(e) => setWritingGoals(e.target.value)}
            placeholder="Set your writing goals for this session..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  // Coaching Tips Tab Content
  const renderCoachingTips = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl border-2 border-orange-200">
        <h3 className="text-xl font-bold text-orange-900 mb-4 flex items-center">
          <Award className="h-6 w-6 mr-2" />
          Writing Feedback & Tips
        </h3>
        
        {evaluation ? (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-semibold text-gray-800">Overall Score</span>
                <div className="flex items-center">
                  <span className="text-3xl font-bold text-orange-600">{evaluation.overallScore || evaluation.score}</span>
                  <span className="text-gray-500 ml-1">/10</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-orange-400 to-red-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${((evaluation.overallScore || evaluation.score) / 10) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Strengths
                </h4>
                <ul className="space-y-1">
                  {(evaluation.strengths || []).map((strength: string, index: number) => (
                    <li key={index} className="text-green-700 text-sm">• {strength}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2" />
                  Areas to Improve
                </h4>
                <ul className="space-y-1">
                  {(evaluation.improvements || []).map((improvement: string, index: number) => (
                    <li key={index} className="text-blue-700 text-sm">• {improvement}</li>
                  ))}
                </ul>
              </div>
            </div>

            {evaluation.specificFeedback && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-2">Detailed Feedback</h4>
                <p className="text-gray-700">{evaluation.specificFeedback || evaluation.detailedFeedback}</p>
              </div>
            )}

            {(evaluation.nextSteps || evaluation.suggestions) && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Next Steps
                </h4>
                <ul className="space-y-1">
                  {(evaluation.nextSteps || evaluation.suggestions || []).map((step: string, index: number) => (
                    <li key={index} className="text-yellow-700 text-sm">• {step}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Write some content and click "Analyze Text Type" to get personalized feedback!</p>
            <button
              onClick={handleEvaluate}
              disabled={!content.trim()}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Get Feedback
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Planning Modal
  const renderPlanningModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center">
              <PenTool className="h-6 w-6 mr-2" />
              Planning Phase
            </h2>
            <button
              onClick={() => setShowPlanningModal(false)}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Planning Notes
              </label>
              <textarea
                value={planningNotes}
                onChange={(e) => setPlanningNotes(e.target.value)}
                placeholder="Brainstorm your ideas, create an outline, or jot down key points..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={8}
              />
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Planning Tips for {textType} Writing:</h3>
              <ul className="text-blue-800 text-sm space-y-1">
                {textType === 'narrative' && (
                  <>
                    <li>• Plan your characters and setting</li>
                    <li>• Think about the problem and solution</li>
                    <li>• Consider the beginning, middle, and end</li>
                    <li>• Include dialogue and descriptive details</li>
                  </>
                )}
                {textType === 'persuasive' && (
                  <>
                    <li>• State your position clearly</li>
                    <li>• List your main arguments</li>
                    <li>• Gather evidence and examples</li>
                    <li>• Plan your conclusion and call to action</li>
                  </>
                )}
                {textType === 'expository' && (
                  <>
                    <li>• Choose your main topic</li>
                    <li>• List key facts and information</li>
                    <li>• Organize information logically</li>
                    <li>• Plan clear explanations and examples</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 flex justify-end">
          <button
            onClick={() => setShowPlanningModal(false)}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Done Planning
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col h-screen bg-gray-50 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Writing Area</h1>
            {isAutoSaving && (
              <div className="flex items-center text-green-600 text-sm">
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                Auto-saving...
              </div>
            )}
            {lastSaved && (
              <div className="text-gray-500 text-sm">
                Last saved: {lastSaved.toLocaleTimeString()}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPlanningModal(true)}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <PenTool className="h-4 w-4 mr-2" />
              Planning
            </button>
            
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Writing Area */}
        <div className="flex-1 flex flex-col">
          {/* Prompt Display */}
          {prompt && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-200 p-6">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Your Writing Prompt</h3>
                  <p className="text-gray-700 leading-relaxed">{prompt}</p>
                </div>
              </div>
            </div>
          )}

          {/* Writing Textarea */}
          <div className="flex-1 p-6">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onMouseUp={handleTextSelection}
              onKeyUp={handleTextSelection}
              placeholder="Start writing your amazing story here! Let your creativity flow and bring your ideas to life..."
              className="w-full h-full p-6 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none text-lg leading-relaxed"
              style={{ 
                fontSize: `${fontSize}px`, 
                lineHeight: lineHeight,
                fontFamily: 'Georgia, serif'
              }}
            />
          </div>

          {/* Bottom Stats Bar */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center text-gray-600">
                  <FileText className="h-4 w-4 mr-1" />
                  <span className="font-medium">{wordCount} words</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Type className="h-4 w-4 mr-1" />
                  <span>{characterCount} characters</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{readingTime} min read</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Play className="h-4 w-4 mr-1" />
                  <span>{formatTime(timeSpent)}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowPlanningModal(true)}
                  className="flex items-center px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <PenTool className="h-4 w-4 mr-1" />
                  Planning
                </button>
                
                <button
                  onClick={handleEvaluate}
                  disabled={!content.trim()}
                  className="flex items-center px-3 py-1 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Award className="h-4 w-4 mr-1" />
                  Evaluate
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Writing Buddy Sidebar */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4">
            <h2 className="text-xl font-bold flex items-center">
              <Heart className="h-5 w-5 mr-2" />
              Writing Buddy
            </h2>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex">
              {[
                { id: 'text-type-analysis', label: 'Text Type Analysis', icon: Target },
                { id: 'vocabulary', label: 'Vocabulary Sophistication', icon: BookOpen },
                { id: 'progress', label: 'Progress Tracking', icon: TrendingUp },
                { id: 'coaching-tips', label: 'Coaching Tips', icon: Award }
              ].map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-2 py-3 text-xs font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-purple-500 text-purple-600 bg-purple-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <IconComponent className="h-4 w-4 mx-auto mb-1" />
                    <div className="text-center">{tab.label}</div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'text-type-analysis' && renderTextTypeAnalysis()}
            {activeTab === 'vocabulary' && renderVocabularySophistication()}
            {activeTab === 'progress' && renderProgressTracking()}
            {activeTab === 'coaching-tips' && renderCoachingTips()}
          </div>
        </div>
      </div>

      {/* Planning Modal */}
      {showPlanningModal && renderPlanningModal()}
    </div>
  );
}
