import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, TouchableOpacity } from 'react-native';

type BreathingPhase = 'idle' | 'inhale' | 'hold' | 'exhale';

const PHASE_CONFIG: Record<
  BreathingPhase,
  { duration: number; text: string; subtext: string; targetScale: number }
> = {
  idle: {
    duration: 0,
    text: 'Preparar...',
    subtext: 'Toque em Iniciar para começar o ciclo 4-7-8',
    targetScale: 1.0,
  },
  inhale: {
    duration: 4,
    text: 'Inspire pelo nariz...',
    subtext: 'Puxe o ar suavemente enchendo o abdômen',
    targetScale: 1.6,
  },
  hold: {
    duration: 7,
    text: 'Segure o ar suavemente...',
    subtext: 'Mantenha o ar sem forçar a respiração',
    targetScale: 1.6,
  },
  exhale: {
    duration: 8,
    text: 'Solte o ar pela boca...',
    subtext: 'Esvazie o peito de maneira lenta e contínua',
    targetScale: 1.0,
  },
};

interface BreathingCircleProps {
  onCycleComplete?: (count: number) => void;
}

export const BreathingCircle: React.FC<BreathingCircleProps> = ({ onCycleComplete }) => {
  const [phase, setPhase] = useState<BreathingPhase>('idle');
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [completedCycles, setCompletedCycles] = useState<number>(0);

  // Animated values
  const scaleAnim = useRef(new Animated.Value(1.0)).current;

  // Refs to manage intervals and active state without stale closures
  const activeRef = useRef<boolean>(false);
  const phaseRef = useRef<BreathingPhase>('idle');
  const currentTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  activeRef.current = isActive;
  phaseRef.current = phase;

  const clearTimer = () => {
    if (currentTimerRef.current) {
      clearInterval(currentTimerRef.current);
      currentTimerRef.current = null;
    }
  };

  const stopAnimation = () => {
    if (currentAnimationRef.current) {
      currentAnimationRef.current.stop();
      currentAnimationRef.current = null;
    }
  };

  // Run a phase of the 4-7-8 cycle
  const runPhase = (nextPhase: BreathingPhase) => {
    if (!activeRef.current) return;

    setPhase(nextPhase);
    const config = PHASE_CONFIG[nextPhase];
    setSecondsLeft(config.duration);

    // Stop previous animation
    stopAnimation();

    // Start scale animation
    const anim = Animated.timing(scaleAnim, {
      toValue: config.targetScale,
      duration: config.duration * 1000,
      useNativeDriver: false,
    });
    currentAnimationRef.current = anim;
    anim.start();

    // Countdown timer for each second
    let remaining = config.duration;
    clearTimer();
    currentTimerRef.current = setInterval(() => {
      if (!activeRef.current) {
        clearTimer();
        return;
      }

      remaining -= 1;
      if (remaining > 0) {
        setSecondsLeft(remaining);
      } else {
        clearTimer();
        // Transition to next phase
        if (nextPhase === 'inhale') {
          runPhase('hold');
        } else if (nextPhase === 'hold') {
          runPhase('exhale');
        } else if (nextPhase === 'exhale') {
          setCompletedCycles((c) => {
            const next = c + 1;
            onCycleComplete?.(next);
            return next;
          });
          runPhase('inhale');
        }
      }
    }, 1000);
  };

  const startExercise = () => {
    setIsActive(true);
    activeRef.current = true;
    runPhase('inhale');
  };

  const pauseExercise = () => {
    setIsActive(false);
    activeRef.current = false;
    clearTimer();
    stopAnimation();
    setPhase('idle');
    setSecondsLeft(0);
    Animated.timing(scaleAnim, {
      toValue: 1.0,
      duration: 500,
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    return () => {
      clearTimer();
      stopAnimation();
    };
  }, []);

  const config = PHASE_CONFIG[phase];

  return (
    <View style={styles.container}>
      {/* Círculo Animado de Respiração */}
      <View style={styles.circleWrapper}>
        {/* Glow / Halo exterior */}
        <Animated.View
          style={[
            styles.outerHalo,
            {
              transform: [{ scale: scaleAnim }],
              opacity: phase === 'hold' ? 0.35 : 0.2,
            },
          ]}
        />
        {/* Círculo Principal */}
        <Animated.View
          style={[
            styles.animatedCircle,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.innerContent}>
            {isActive ? (
              <>
                <Text style={styles.secondCounter}>{secondsLeft}s</Text>
                <Text style={styles.phaseBadge}>
                  {phase === 'inhale' ? 'Inspire' : phase === 'hold' ? 'Segure' : 'Solte'}
                </Text>
              </>
            ) : (
              <Text style={styles.idleIcon}>🌿</Text>
            )}
          </View>
        </Animated.View>
      </View>

      {/* Instruções de Texto */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionTitle}>{config.text}</Text>
        <Text style={styles.instructionSubtext}>{config.subtext}</Text>
      </View>

      {/* Contador de Ciclos */}
      {completedCycles > 0 && (
        <View style={styles.cyclesBadge}>
          <Text style={styles.cyclesText}>
            {completedCycles === 1
              ? '1 ciclo completo realizado'
              : `${completedCycles} ciclos completos realizados`}
          </Text>
        </View>
      )}

      {/* Controles de Play / Pause */}
      <View style={styles.controlsRow}>
        {!isActive ? (
          <TouchableOpacity
            style={styles.startButton}
            onPress={startExercise}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Iniciar exercício de respiração"
          >
            <Text style={styles.startButtonText}>▶ Iniciar Respiração</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.pauseButton}
            onPress={pauseExercise}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Pausar exercício de respiração"
          >
            <Text style={styles.pauseButtonText}>⏸ Pausar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    width: '100%',
  },
  circleWrapper: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  outerHalo: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: '#10b981',
  },
  animatedCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#0d9488',
    borderWidth: 3,
    borderColor: '#2dd4bf',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  idleIcon: {
    fontSize: 40,
  },
  secondCounter: {
    fontSize: 34,
    fontWeight: '800',
    color: '#ffffff',
  },
  phaseBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a7f3d0',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  instructionsContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    minHeight: 64,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 6,
  },
  instructionSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  cyclesBadge: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  cyclesText: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '600',
  },
  controlsRow: {
    marginTop: 24,
    width: '100%',
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 28,
    minWidth: 220,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  pauseButton: {
    backgroundColor: '#334155',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 28,
    minWidth: 220,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  pauseButtonText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
});
